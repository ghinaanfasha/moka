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
                    updateData.breakdownStatus = 'Belum Selesai';
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
    const t = await sequelize.transaction();    
    try {
        const {
            nama_tugas,
            deskripsi,
            tanggal_pengumpulan,
            jam_pengumpulan,
            staff_tasks
        } = req.body;

        if (!nama_tugas || !tanggal_pengumpulan || !jam_pengumpulan || !staff_tasks) {
            throw new Error('Semua field wajib diisi');
        }

        const taskFile = req.file ? `/uploads/${req.file.filename}` : null;

        const deadline = new Date(`${tanggal_pengumpulan}T${jam_pengumpulan}`);

        if (isNaN(deadline.getTime())) {
            throw new Error('Format tanggal atau jam tidak valid');
        }
        
        if (deadline < new Date()) {
            throw new Error('Deadline tidak boleh di masa lalu');
        }

        const task = await Task.create({
            taskName: nama_tugas,
            taskDesc: deskripsi || '',
            taskFile: taskFile,
            deadline: deadline,
            assignorID: req.user.userID,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction: t });
        const staffTasks = JSON.parse(staff_tasks);

        if (!Array.isArray(staffTasks)) {
            throw new Error('Format staff_tasks tidak valid');
        }

        const breakdownPromises = [];
        for (const { staffId, rincian } of staffTasks) {
            if (!Array.isArray(rincian)) {
                throw new Error('Format rincian tidak valid');
            }

            for (const breakdown of rincian) {
                if (!breakdown.trim()) {
                    throw new Error('Rincian tugas tidak boleh kosong');
                }

                breakdownPromises.push(
                    TaskBreakdown.create({
                        taskID: task.taskID,
                        assigneeID: staffId,
                        taskBreakdown: breakdown.trim(),
                        breakdownStatus: 'Diberikan',
                        readStatus: false,
                        taskStatus: 'Diberikan',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }, { transaction: t })
                );
            }
        }

        await Promise.all(breakdownPromises);
        await t.commit();

        res.json({
            success: true,
            message: 'Tugas berhasil ditambahkan',
            taskId: task.taskID
        });

    } catch (error) {
        await t.rollback();

        if (req.file) {
            try {
                await fs.unlink(path.join(__dirname, '..', 'public', req.file.path));
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        
        console.error('Error adding task:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal menambahkan tugas'
        });
    }
};

const showRiwayat = async (req, res) => {
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
                    ],
                    where: {
                        taskStatus: 'Selesai' 
                    }
                }
            ],
            order: [['createdAt', 'DESC']] 
        });

        // Format the tasks data
        const formattedTasks = tasks.map(task => {
            const breakdowns = task.breakdowns || [];
            const totalBreakdowns = breakdowns.length;
            const completedBreakdowns = breakdowns.filter(bd => bd.breakdownStatus === 'Selesai').length;
            const progress = totalBreakdowns ? (completedBreakdowns / totalBreakdowns) * 100 : 0;

            return {
                taskID: task.taskID,
                taskName: task.taskName,
                taskDesc: task.taskDesc,
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
                submitTask: breakdowns.map(bd => bd.submitTask || '-')
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
    showRiwayat
};