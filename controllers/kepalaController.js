const { User, Role, Dept, Task, TaskBreakdown } = require('../models');
const { sequelize } = require('../models');
const upload = require('../middleware/upload');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

const getUser = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ]
        });

        const userData = {
            id: currentUser.userID,
            username: currentUser.username,
            jabatan: currentUser.role ? currentUser.role.roleName : '-',
            bidang: currentUser.dept ? currentUser.dept.deptName : '-'
        };

        res.render('kepala/dashboard', { 
            user: userData,  
            currentPage: '/kepala/dashboard' 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('error', { 
            message: 'Internal Server Error', 
            error: error 
        });
    }
};

const showTugas = async (req, res) => {
    try {
        const role = await User.findOne({
            where: { userID: req.user.userID },
            include: [{ model: Role, as: 'role' }]
        });

        const tasks = await Task.findAll({
            where: { assignorID: req.user.userID },
            include: [
                {
                    model: TaskBreakdown,
                    as: 'breakdowns',
                    include: [
                        {
                            model: User,
                            as: 'assignee',
                            attributes: ['username']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        const formattedTasks = tasks.map(task => {
            const breakdowns = task.breakdowns || [];
            const totalBreakdowns = breakdowns.length;
            const completedBreakdowns = breakdowns.filter(bd => bd.breakdownStatus === 'Selesai').length;
            const progress = totalBreakdowns ? (completedBreakdowns / totalBreakdowns) * 100 : 0;

            // Periksa apakah semua taskStatus dari breakdown dalam satu task sudah 'Selesai'
            const allTaskStatusCompleted = breakdowns.every(bd => bd.taskStatus === 'Selesai');

            // Jika semua taskStatus selesai, task ini akan dilewati
            if (allTaskStatusCompleted) {
                return null;
            }

            // Group breakdowns by assignee untuk menampilkan dalam satu baris
            const breakdownsByAssignee = {};
            breakdowns.forEach(bd => {
                const username = bd.assignee.username;
                if (!breakdownsByAssignee[username]) {
                    breakdownsByAssignee[username] = {
                        readStatus: bd.readStatus,
                        readAt: bd.readAt || '-',
                        taskStatus: bd.taskStatus
                    };
                }
            });

            const assignees = Object.keys(breakdownsByAssignee);
            
            return {
                taskID: task.taskID,
                taskName: task.taskName,
                createdAt: task.createdAt,
                deadline: task.deadline,
                namaStaff: assignees,
                statusBaca: assignees.map(name => breakdownsByAssignee[name].readStatus),
                readAt: assignees.map(name => breakdownsByAssignee[name].readAt),
                progress: `${progress.toFixed(0)}%`,
                keterangan: assignees.map(name => breakdownsByAssignee[name].taskStatus)
            };
        }).filter(task => task !== null);

        res.render('kepala/tugas', {
            user: {
                username: role.username,
                jabatan: role.role ? role.role.roleName : ''
            },
            currentPage: '/kepala/tugas',
            tasks: formattedTasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).render('error', {
            message: 'Internal Server Error',
            error: error
        });
    }
};

const showTaskProgress = async (req, res) => {
    try {
        const role = await User.findOne({
            where: { userID: req.user.userID },
            include: [{ model: Role, as: 'role' }]
        });

        const taskID = req.params.taskID;
        const task = await Task.findOne({
            where: { taskID },
            include: [
                {
                    model: User,
                    as: 'assignor',
                    attributes: ['username']
                },
                {
                    model: TaskBreakdown,
                    as: 'breakdowns',
                    include: [
                        {
                            model: User,
                            as: 'assignee',
                            attributes: ['username']
                        }
                    ]
                }
            ]
        });

        if (!task) {
            return res.status(404).render('error', {
                message: 'Task not found',
                error: { status: 404 }
            });
        }

        // Menghitung persentase
        const totalBreakdowns = task.breakdowns.length;
        const completedBreakdowns = task.breakdowns.filter(bd => bd.breakdownStatus === 'Selesai').length;
        const progressPercentage = totalBreakdowns ? (completedBreakdowns / totalBreakdowns) * 100 : 0;

        const taskData = {
            taskInfo: {
                taskName: task.taskName,
                assignor: task.assignor.username,
                taskDesc: task.taskDesc,
                taskFile: task.taskFile,
                createdAt: task.createdAt.getTime(),
                deadline: task.deadline.getTime(),
                assignee: task.breakdowns[0].assignee.username
            },
            breakdowns: task.breakdowns.map(breakdown => ({
                taskBreakdownID: breakdown.taskBreakdownID,
                taskBreakdown: breakdown.taskBreakdown,
                assignee: breakdown.assignee.username,
                breakdownStatus: breakdown.breakdownStatus,
                submitTask: breakdown.submitTask,
                submitTime: breakdown.submitTime,
                taskNote: breakdown.taskNote,
                feedback: breakdown.feedback,
                taskStatus: breakdown.taskStatus
            })),
            progress: `${progressPercentage.toFixed(0)}%`
        };

        res.render('kepala/infoProgresTugas', {
            user: {
                username: role.username,
                jabatan: role.role ? role.role.roleName : ''
            },
            currentPage: '/kepala/tugas',
            taskData
        });

    } catch (error) {
        console.error('Error fetching task progress:', error);
        res.status(500).render('error', {
            message: 'Internal Server Error',
            error
        });
    }
};

const updateTaskProgress = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request format'
            });
        }

        const updatePromises = updates.map(async (update) => {
            const { taskBreakdownID, feedback, taskStatus } = update;

            const breakdown = await TaskBreakdown.findByPk(taskBreakdownID);
            
            if (!breakdown) {
                throw new Error(`Breakdown with ID ${taskBreakdownID} not found`);
            }

            const updateData = {};

            if (feedback !== undefined) {
                updateData.feedback = feedback;
            }

            if (taskStatus !== undefined) {
                updateData.taskStatus = taskStatus;

                if (taskStatus === 'Revisi') {
                    updateData.breakdownStatus = 'Belum selesai';
                    updateData.submitTime = null; 
                }
            }

            await breakdown.update(updateData);
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: 'Task progress updated successfully'
        });

    } catch (error) {
        console.error('Error updating task progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task progress',
            error: error.message
        });
    }
};

const showFormAddTugas = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ]
        });

        const userData = {
            id: currentUser.userID,
            username: currentUser.username,
            jabatan: currentUser.role ? currentUser.role.roleName : '-',
            bidang: currentUser.dept ? currentUser.dept.deptName : '-'
        };

        res.render('kepala/formAddTugas', { 
            user: userData,  
            currentPage: '/kepala/tugas' 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('error', { 
            message: 'Internal Server Error', 
            error: error 
        });
    }
};

const getStaffForAssignment = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { 
                    model: Role, 
                    as: 'role', 
                    attributes: ['roleName'] 
                },
                { 
                    model: Dept, 
                    as: 'dept', 
                    attributes: ['deptName', 'deptID'] 
                }
            ]
        });

        console.log('Current User Details:', {
            userID: currentUser.userID,
            username: currentUser.username,
            roleName: currentUser.role ? currentUser.role.roleName : 'No Role',
            deptID: currentUser.deptID,
            deptName: currentUser.dept ? currentUser.dept.deptName : 'No Department'
        });

        let staffQuery = {
            include: [
                { 
                    model: Role, 
                    as: 'role', 
                    attributes: ['roleName'] 
                },
                { 
                    model: Dept, 
                    as: 'dept', 
                    attributes: ['deptName'] 
                }
            ],
            where: {
                userID: { [Op.ne]: req.user.userID }
            }
        };

        switch(currentUser.role.roleName) {
            case 'Kepala BAPPEDA':
                // Menarik data semua user kecuali admin
                staffQuery.where = {
                    [Op.and]: [
                        { '$role.roleName$': { [Op.ne]: 'Admin' } },
                        { userID: { [Op.ne]: req.user.userID } }    
                    ]
                };
                break;
            
            case 'Kepala Bidang':
                // Menarik data staff di bidang yang sama dan programmer
                staffQuery.where = {
                    [Op.and]: [
                        { userID: { [Op.ne]: req.user.userID } },  
                        {
                            [Op.or]: [
                                { deptID: currentUser.deptID },  
                                { '$role.roleName$': 'PROGRAMMER' },  
                                { 
                                    '$role.roleName$': 'Staff',
                                    '$dept.deptName$': 'PROGRAMMER'  
                                }
                            ]
                        }
                    ]
                };
                break;
            
            case 'Staff':
                if (currentUser.dept && currentUser.dept.deptName === 'PROGRAMMER') {
                    // Staff dari bidang programmer melihat semua staff
                    staffQuery.where = {
                        [Op.and]: [
                            { '$role.roleName$': 'Staff' },  // Only see Staff role
                            { userID: { [Op.ne]: req.user.userID } }  // Exclude themselves
                        ]
                    };
                } else {
                    // Staff diluar programmer melihat staff dari bidang yang sama dan programmer
                    staffQuery.where = {
                        [Op.and]: [
                            { userID: { [Op.ne]: req.user.userID } },
                            {
                                [Op.or]: [
                                    { deptID: currentUser.deptID },
                                    { '$role.roleName$': 'PROGRAMMER' },
                                    { 
                                        '$role.roleName$': 'Staff',
                                        '$dept.deptName$': 'PROGRAMMER'
                                    }
                                ]
                            }
                        ]
                    };
                }
                break;
            
            default:
                return res.json([]);
        }

        const staff = await User.findAll({
            ...staffQuery,
            logging: console.log
        });

        console.log('Found Staff:', staff.map(u => ({
            id: u.userID,
            username: u.username,
            role: u.role ? u.role.roleName : 'No Role',
            dept: u.dept ? u.dept.deptName : 'No Department'
        })));

        const formattedStaff = staff.map(user => ({
            userID: user.userID,
            username: user.username,
            roleName: user.role ? user.role.roleName : '',
            deptName: user.dept ? user.dept.deptName : ''
        }));

        console.log('Formatted Staff:', formattedStaff);

        res.json(formattedStaff);
    } catch (error) {
        console.error('Error in getStaffForAssignment:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
            stack: error.stack
        });
    }
};

const addTask = async (req, res) => {
    const transaction = await sequelize.transaction();
    let taskFile = null;
    
    try {
        console.log('Form data:', req.body);
        console.log('File:', req.file);

        const {
            nama_tugas,
            deskripsi,
            tanggal_pengumpulan,
            jam_pengumpulan,
            staff_tasks
        } = req.body;

        if (!nama_tugas?.trim()) throw new Error('Nama tugas harus diisi');
        if (!deskripsi?.trim()) throw new Error('Deskripsi tugas harus diisi');
        if (!tanggal_pengumpulan) throw new Error('Tanggal pengumpulan harus diisi');
        if (!jam_pengumpulan) throw new Error('Jam pengumpulan harus diisi');
        if (!staff_tasks) throw new Error('Data staff tasks diperlukan');

        if (req.file) {
            taskFile = req.file.filename;
        }

        const deadline = new Date(`${tanggal_pengumpulan}T${jam_pengumpulan}`);
        if (isNaN(deadline.getTime())) {
            throw new Error('Format tanggal atau jam tidak valid');
        }

        const task = await Task.create({
            assignorID: req.user.userID,
            taskName: nama_tugas.trim(),
            taskDesc: deskripsi.trim(),
            taskFile: taskFile,
            deadline: deadline,
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        let staffTasksData;
        try {
            staffTasksData = JSON.parse(staff_tasks);
        } catch (error) {
            console.error('Error parsing staff_tasks:', error);
            throw new Error('Format data staff tasks tidak valid');
        }

        if (!Array.isArray(staffTasksData) || staffTasksData.length === 0) {
            throw new Error('Minimal satu staff harus dipilih');
        }

        const breakdownPromises = staffTasksData.flatMap(staffTask => {
            if (!staffTask.staffId || !Array.isArray(staffTask.rincian)) {
                throw new Error('Format rincian tugas tidak valid');
            }

            return staffTask.rincian.map(rincian => 
                TaskBreakdown.create({
                    taskID: task.taskID,
                    assigneeID: staffTask.staffId,
                    taskBreakdown: rincian.trim(),
                    breakdownStatus: "Belum selesai",
                    taskStatus: "Diberikan",
                    readStatus: "Belum dibaca",
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction })
            );
        });

        await Promise.all(breakdownPromises);
        await transaction.commit();

        res.json({
            success: true,
            message: 'Tugas berhasil ditambahkan',
            taskID: task.taskID
        });

    } catch (error) {
        console.error('Error in addTask:', error);
        await transaction.rollback();

        if (taskFile && req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Gagal menambahkan tugas'
        });
    }
};

const getTaskForEdit = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ]
        });

        const userData = {
            id: currentUser.userID,
            username: currentUser.username,
            jabatan: currentUser.role ? currentUser.role.roleName : '-',
            bidang: currentUser.dept ? currentUser.dept.deptName : '-'
        };

        const taskId = req.params.taskId;
        
        const task = await Task.findOne({
            where: { taskID: taskId },
            include: [
                {
                    model: TaskBreakdown,
                    as: 'breakdowns',
                    include: [
                        {
                            model: User,
                            as: 'assignee',
                            include: [
                                { model: Role, as: 'role' },
                                { model: Dept, as: 'dept' }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan'
            });
        }

        if (task.assignorID !== req.user.userID) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk mengedit tugas ini'
            });
        }

        res.render('kepala/editTask', {             
            user: userData,  
            task,
            currentPage: '/kepala/tugas' 
        });
    } catch (error) {
        console.error('Error in getTaskForEdit:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data tugas'
        });
    }
};

const editTask = async (req, res) => {
    const transaction = await sequelize.transaction();
    let taskFile = null;
    
    try {
        const taskId = req.params.taskId;

        const {
            deskripsi,
            tanggal_pengumpulan,
            jam_pengumpulan,
            task_breakdowns
        } = req.body;

        if (!deskripsi?.trim()) throw new Error('Deskripsi tugas harus diisi');
        if (!tanggal_pengumpulan) throw new Error('Tanggal pengumpulan harus diisi');
        if (!jam_pengumpulan) throw new Error('Jam pengumpulan harus diisi');
        if (!task_breakdowns) throw new Error('Data rincian tugas diperlukan');

        const existingTask = await Task.findByPk(taskId);
        if (!existingTask) {
            throw new Error('Tugas tidak ditemukan');
        }

        if (req.file) {
            taskFile = req.file.filename;
            if (existingTask.taskFile) {
                const oldFilePath = path.join(__dirname, '../uploads', existingTask.taskFile);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        }

        const deadline = new Date(`${tanggal_pengumpulan}T${jam_pengumpulan}`);
        if (isNaN(deadline.getTime())) {
            throw new Error('Format tanggal atau jam tidak valid');
        }

        await existingTask.update({
            taskDesc: deskripsi.trim(),
            ...(taskFile && { taskFile }),
            deadline: deadline,
            updatedAt: new Date()
        }, { transaction });

        let taskBreakdownsData;
        try {
            taskBreakdownsData = JSON.parse(task_breakdowns);
        } catch (error) {
            throw new Error('Format data rincian tugas tidak valid');
        }

        const updatePromises = taskBreakdownsData.map(async (breakdown) => {
            const taskBreakdown = await TaskBreakdown.findOne({
                where: { 
                    taskBreakdownID: breakdown.taskBreakdownID,
                    taskID: taskId
                }
            });

            if (!taskBreakdown) {
                throw new Error(`Rincian tugas dengan ID ${breakdown.taskBreakdownID} tidak ditemukan`);
            }

            return taskBreakdown.update({
                taskBreakdown: breakdown.rincian.trim(),
                updatedAt: new Date()
            }, { transaction });
        });

        await Promise.all(updatePromises);
        await transaction.commit();

        res.json({
            success: true,
            message: 'Tugas berhasil diperbarui',
            taskID: taskId
        });

    } catch (error) {
        console.error('Error in editTask:', error);
        await transaction.rollback();

        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Gagal memperbarui tugas'
        });
    }
};

const deleteTask = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const taskId = req.params.taskId;

        const task = await Task.findOne({
            where: { taskID: taskId },
            include: [{
                model: TaskBreakdown,
                as: 'breakdowns'
            }]
        });

        if (!task) {
            throw new Error('Tugas tidak ditemukan');
        }

        if (task.assignorID !== req.user.userID) {
            throw new Error('Anda tidak memiliki akses untuk menghapus tugas ini');
        }

        if (task.taskFile) {
            try {
                const filePath = path.join(__dirname, '../uploads', task.taskFile);
                await fs.stat(filePath);
                await fs.unlink(filePath);
            } catch (fileError) {
                console.error('Error saat menghapus file:', fileError);
            }
        }

        if (task.breakdowns && task.breakdowns.length > 0) {
            await TaskBreakdown.destroy({
                where: { taskID: taskId },
                transaction
            });
        }

        await task.destroy({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Tugas berhasil dihapus'
        });

    } catch (error) {
        console.error('Error in deleteTask:', error);
        await transaction.rollback();

        const statusCode = error.message.includes('akses') ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Gagal menghapus tugas'
        });
    }
};

const showRiwayat = async (req, res) => {
    try {
        const role = await User.findOne({
            where: { userID: req.user.userID },
            include: [{ model: Role, as: 'role' }]
        });

        tasksQuery = {
            include: [
                {
                    model: User,
                    as: 'assignor',
                    attributes: ['username']
                },
                {
                    model: TaskBreakdown,
                    as: 'breakdowns',
                    include: [
                        {
                            model: User,
                            as: 'assignee',
                            attributes: ['username']
                        }
                    ]
                }
            ]
        };

        tasksQuery.order = [['createdAt', 'DESC']];
        
        const tasks = await Task.findAll(tasksQuery);

        const completedTasks = tasks.filter(task => {
            const breakdowns = task.breakdowns || [];
            return breakdowns.length > 0 && breakdowns.every(bd => bd.taskStatus === 'Selesai');
        });

        const formattedTasks = completedTasks.map(task => {
            const breakdowns = task.breakdowns || [];
            const totalBreakdowns = breakdowns.length;
            const completedBreakdowns = breakdowns.filter(bd => bd.breakdownStatus === 'Selesai').length;
            const progress = totalBreakdowns ? (completedBreakdowns / totalBreakdowns) * 100 : 0;

            return {
                taskID: task.taskID,
                taskName: task.taskName,
                taskDesc: task.taskDesc,
                assignor: task.assignor.username,
                createdAt: task.createdAt,
                deadline: task.deadline,
                namaStaff: breakdowns.map(bd => bd.assignee.username),
                statusBaca: breakdowns.map(bd => bd.readStatus),
                readAt: breakdowns.map(bd => bd.readAt || '-'),
                submitTime: breakdowns.map(bd => bd.submitTime || '-'),
                progress: `${progress.toFixed(0)}%`,
                keterangan: breakdowns.map(bd => bd.taskStatus),
                feedback: breakdowns.map(bd => bd.feedback || '-'),
                taskNote: breakdowns.map(bd => bd.taskNote || '-'),
                submitTask: breakdowns.map(bd => bd.submitTask || '-'),
                taskBreakdown: breakdowns.map(bd => bd.taskBreakdown || '-')
            };
        });

        res.render('kepala/riwayat', {
            user: {
                username: role.username,
                jabatan: role.role ? role.role.roleName : ''
            },
            currentPage: '/kepala/riwayat',
            tasks: formattedTasks
        });

    } catch (error) {
        console.error('Error fetching task history:', error);
        res.status(500).render('error', {
            message: 'Internal Server Error',
            error: error
        });
    }
};

module.exports = { 
    getUser, 
    showTugas, showTaskProgress, updateTaskProgress, 
    showFormAddTugas, getStaffForAssignment, addTask, 
    getTaskForEdit, editTask, deleteTask,
    showRiwayat
};