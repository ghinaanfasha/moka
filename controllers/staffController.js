const { Sequelize } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const { User, Role, Dept, Task, TaskBreakdown } = require('../models');

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

        res.render('staff/dashboard', { 
            user: userData,  
            currentPage: '/staff/dashboard' 
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

        res.render('staff/tugas', {
            user: {
                username: role.username,
                jabatan: role.role ? role.role.roleName : ''
            },
            currentPage: '/staff/tugas',
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
                taskID: task.taskID, 
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

        res.render('staff/infoProgresTugas', {
            user: {
                username: role.username,
                jabatan: role.role ? role.role.roleName : ''
            },
            currentPage: '/staff/tugas',
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

const showDaftarTugas = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ]
        });

        // Find all task breakdowns for the user
        const taskBreakdowns = await TaskBreakdown.findAll({
            where: { 
                assigneeID: req.user.userID
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    include: [
                        {
                            model: User,
                            as: 'assignor',
                            attributes: ['username']
                        }
                    ]
                }
            ],
            order: [[{ model: Task, as: 'task' }, 'createdAt', 'DESC']]
        });

        // Group tasks and their breakdowns
        const groupedTasks = taskBreakdowns.reduce((acc, breakdown) => {
            const taskID = breakdown.task.taskID;
            if (!acc[taskID]) {
                acc[taskID] = {
                    taskID: breakdown.task.taskID,
                    namaTugas: breakdown.task.taskName,
                    deskripsiTugas: breakdown.task.taskDesc,
                    penugas: breakdown.task.assignor.username,
                    deadline: breakdown.task.deadline,
                    createdAt: breakdown.task.createdAt,
                    rincianTugas: [],
                    readAt: breakdown.readAt
                };
            }
            // Include all breakdowns initially
            acc[taskID].rincianTugas.push({
                taskBreakdownID: breakdown.taskBreakdownID,
                rincian: breakdown.taskBreakdown,
                keterangan: breakdown.taskStatus,
                status: breakdown.readStatus
            });
            return acc;
        }, {});

        // Filter out tasks where ALL breakdowns are 'Selesai'
        const filteredGroupedTasks = Object.entries(groupedTasks)
            .filter(([_, task]) => {
                // Keep task if at least one breakdown is not 'Selesai'
                return !task.rincianTugas.every(breakdown => breakdown.keterangan === 'Selesai');
            })
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        const formattedTasks = Object.values(filteredGroupedTasks).map((task, index) => ({
            taskID: task.taskID,
            no: index + 1,
            namaTugas: task.namaTugas,
            deskripsiTugas: task.deskripsiTugas,
            penugas: task.penugas,
            deadline: task.deadline,
            createdAt: task.createdAt,
            rincianTugas: task.rincianTugas,
            readAt: task.readAt,
            status: task.rincianTugas[0].status
        }));

        console.log('Filtered Task IDs:', formattedTasks.map(t => ({ 
            taskID: t.taskID, 
            no: t.no,
            breakdownStatuses: t.rincianTugas.map(r => r.keterangan)
        })));

        res.render('staff/daftarTugas', {
            user: {
                username: currentUser.username,
                jabatan: currentUser.role ? currentUser.role.roleName : '-',
                bidang: currentUser.dept ? currentUser.dept.deptName : '-'
            },
            currentPage: '/staff/daftarTugas',
            tasks: formattedTasks,
            helpers: {
                formatDateTime: function(isoString) {
                    if (!isoString || isoString === '-') return { time: '-', date: '-' };
                    const date = new Date(isoString);
                    const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = date.toLocaleDateString('id-ID', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                    });
                    return { time, date: dateStr };
                }
            }
        });

    } catch (error) {
        console.error('Error fetching assigned tasks:', error);
        res.status(500).render('error', {
            message: 'Internal Server Error',
            error: error
        });
    }
};

const updateReadStatus = async (req, res) => {
    try {
        const { taskId, status } = req.body;
        console.log('Update Read Status Request:', {
            taskId,
            status,
            userRole: req.user.roleName,
            userId: req.user.userID
        });

        const currentTime = new Date();

        const taskBreakdowns = await TaskBreakdown.findAll({
            where: {
                taskID: taskId,
                assigneeID: req.user.userID
            }
        });

        console.log('Found task breakdowns:', taskBreakdowns.length);

        await Promise.all(
            taskBreakdowns.map(breakdown => {
                console.log('Updating breakdown:', breakdown.taskBreakdownID);
                return breakdown.update({ 
                    readStatus: status,
                    readAt: status === 'Sudah dibaca' ? currentTime : null 
                });
            })
        );

        res.status(200).json({
            success: true,
            message: 'Status baca berhasil diperbarui',
            readAt: status === 'Sudah dibaca' ? currentTime : null
        });

    } catch (error) {
        console.error('Error updating read status:', {
            error: error.message,
            stack: error.stack,
            userRole: req.user.roleName
        });
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui status baca'
        });
    }
};

const showFormProgresTugas = async (req, res) => {
    try {
        const taskID = req.params.taskID;
        console.log('Requested Task ID:', taskID);

        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ]
        });

        const task = await Task.findByPk(taskID, {
            include: [
                {
                    model: User,
                    as: 'assignor',
                    attributes: ['username']
                },
                {
                    model: TaskBreakdown,
                    as: 'breakdowns',
                    where: { assigneeID: req.user.userID },
                    required: true
                }
            ]
        });

        if (!task) {
            return res.status(404).render('error', {
                message: 'Task not found',
                error: { status: 404 }
            });
        }

        const formattedTask = {
            id: task.taskID,
            namaTugas: task.taskName,
            deskripsiTugas: task.taskDesc,
            penugas: task.assignor.username,
            createdAt: task.createdAt.getTime(),
            deadline: task.deadline.getTime(),
            taskFile: task.taskFile,
            breakdowns: task.breakdowns.map(breakdown => ({
                id: breakdown.taskBreakdownID,
                rincian: breakdown.taskBreakdown,
                breakdownStatus: breakdown.breakdownStatus || 'Belum selesai', // Menggunakan breakdownStatus
                taskStatus: breakdown.taskStatus,
                submitFile: breakdown.submitTask,
                submitTime: breakdown.submitTime,
                note: breakdown.taskNote,
                feedback: breakdown.feedback
            }))
        };

        res.render('staff/formProgresTugas', {
            user: {
                username: currentUser.username,
                jabatan: currentUser.role ? currentUser.role.roleName : '-',
                bidang: currentUser.dept ? currentUser.dept.deptName : '-'
            },
            currentPage: '/staff/daftarTugas',
            task: formattedTask
        });

    } catch (error) {
        console.error('Error showing task progress form:', error);
        res.status(500).render('error', {
            message: 'Internal Server Error',
            error: error
        });
    }
};

const showFormUpdateTugas = async (req, res) => {
    try {
        const taskID = req.params.taskID;
        const breakdownID = req.params.breakdownID;
        
        if (!taskID || !breakdownID) {
            throw new Error('Invalid task or breakdown ID');
        }

        const currentUser = await User.findByPk(req.user.userID, {
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ]
        });

        const task = await Task.findOne({
            where: { taskID: taskID },
            include: [
                {
                    model: User,
                    as: 'assignor',
                    attributes: ['username']
                },
                {
                    model: TaskBreakdown,
                    as: 'breakdowns',
                    where: { 
                        taskBreakdownID: breakdownID,
                        assigneeID: req.user.userID 
                    },
                    required: true
                }
            ]
        });

        if (!task || !task.breakdowns || task.breakdowns.length === 0) {
            throw new Error('Task or breakdown not found');
        }

        const formattedTask = {
            taskID: task.taskID.toString(),
            namaTugas: task.taskName,
            deskripsiTugas: task.taskDesc,
            penugas: task.assignor.username,
            createdAt: task.createdAt.getTime(),
            deadline: task.deadline.getTime(),
            taskFile: task.taskFile,
            rincian: task.breakdowns[0].taskBreakdown,
            breakdownStatus: task.breakdowns[0].breakdownStatus || 'Belum selesai',
            submitFile: task.breakdowns[0].submitTask,
            taskNote: task.breakdowns[0].taskNote,
            feedback: task.breakdowns[0].feedback,
            breakdownID: task.breakdowns[0].taskBreakdownID.toString()
        };

        res.render('staff/formUpdateTugas', {
            user: {
                username: currentUser.username,
                jabatan: currentUser.role ? currentUser.role.roleName : '-',
                bidang: currentUser.dept ? currentUser.dept.deptName : '-'
            },
            currentPage: '/staff/daftarTugas',
            task: formattedTask
        });

    } catch (error) {
        console.error('Error showing task update form:', error);
        res.status(500).render('error', {
            message: error.message || 'Internal Server Error',
            error: { status: 500 }
        });
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/submissions/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const fileTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|ppt|pptx/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX yang diperbolehkan.'));
        }
    }
}).single('submitFile');

const updateBreakdownStatus = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                console.error('File upload error:', err);
                return res.status(400).json({
                    status: 'error',
                    message: err.message
                });
            }

            const { taskID, breakdownID } = req.params;
            const { status, note } = req.body;

            if (!taskID || !breakdownID) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid task or breakdown ID'
                });
            }

            if (!status) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Status wajib diisi.'
                });
            }

            // Cari breakdown yang akan diupdate
            const breakdown = await TaskBreakdown.findOne({
                where: {
                    taskBreakdownID: breakdownID,
                    taskID: taskID,
                    assigneeID: req.user.userID
                }
            });

            if (!breakdown) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Task breakdown tidak ditemukan.'
                });
            }

            // Jika status diubah menjadi "Belum selesai"
            if (status === 'Belum selesai') {
                // Hapus file jika ada
                if (breakdown.submitTask) {
                    try {
                        const oldFilePath = path.join(__dirname, '../public/uploads/submissions/', breakdown.submitTask);
                        await fs.unlink(oldFilePath);
                    } catch (error) {
                        console.error('Error deleting old file:', error);
                    }
                }

                // Update langsung menggunakan query SQL untuk memastikan kolom di-set ke NULL
                await breakdown.sequelize.query(
                    'UPDATE TaskBreakdowns SET breakdownStatus = ?, taskNote = ?, submitTime = NULL, submitTask = NULL WHERE taskBreakdownID = ? AND taskID = ?',
                    {
                        replacements: [status, note || null, breakdownID, taskID],
                        type: Sequelize.QueryTypes.UPDATE
                    }
                );
            } else {
                let updateData = {
                    breakdownStatus: status,
                    taskNote: note || null
                };

                // Update submitTime jika ada perubahan
                const hasChanges = 
                    status !== breakdown.breakdownStatus ||
                    note !== breakdown.taskNote ||
                    req.file;

                if (hasChanges) {
                    updateData.submitTime = Sequelize.literal('CURRENT_TIMESTAMP');
                }

                // Handle file upload
                if (req.file) {
                    if (breakdown.submitTask) {
                        try {
                            const oldFilePath = path.join(__dirname, '../public/uploads/submissions/', breakdown.submitTask);
                            await fs.unlink(oldFilePath);
                        } catch (error) {
                            console.error('Error deleting old file:', error);
                        }
                    }
                    updateData.submitTask = req.file.filename;
                }

                await TaskBreakdown.update(updateData, {
                    where: {
                        taskBreakdownID: breakdownID,
                        taskID: taskID
                    }
                });
            }

            // Ambil data terbaru setelah update
            const updatedBreakdown = await TaskBreakdown.findOne({
                where: {
                    taskBreakdownID: breakdownID,
                    taskID: taskID
                }
            });

            return res.status(200).json({
                status: 'success',
                message: 'Status tugas berhasil diperbarui.',
                data: {
                    taskID,
                    breakdownID,
                    breakdownStatus: updatedBreakdown.breakdownStatus,
                    note: updatedBreakdown.taskNote,
                    submitTask: updatedBreakdown.submitTask,
                    submitTime: updatedBreakdown.submitTime
                }
            });
        });
    } catch (error) {
        console.error('Error updating task breakdown:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat memperbarui tugas.'
        });
    }
};

const downloadSubmission = async (req, res) => {
    try {
        const { taskID, breakdownID } = req.params;
        
        console.log('Download request for:', { taskID, breakdownID }); 

        if (!taskID || !breakdownID) {
            console.log('Missing taskID or breakdownID');
            return res.status(400).json({
                status: 'error',
                message: 'TaskID dan BreakdownID diperlukan'
            });
        }

        const breakdown = await TaskBreakdown.findOne({
            where: { 
                taskBreakdownID: breakdownID,
                taskID: taskID
            }
        });

        console.log('Found breakdown:', breakdown); 

        if (!breakdown) {
            console.log('Breakdown not found');
            return res.status(404).json({
                status: 'error',
                message: 'Task breakdown tidak ditemukan'
            });
        }

        if (!breakdown.submitTask) {
            console.log('No submitTask found');
            return res.status(404).json({
                status: 'error',
                message: 'File tidak ditemukan'
            });
        }

        const filePath = path.join(__dirname, '../public/uploads/submissions/', breakdown.submitTask);
        
        console.log('File path:', filePath);

        if (!fs.existsSync(filePath)) {
            console.log('File does not exist at path:', filePath);
            return res.status(404).json({
                status: 'error',
                message: 'File tidak ditemukan di server'
            });
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${breakdown.submitTask}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            res.status(500).json({
                status: 'error',
                message: 'Gagal membaca file'
            });
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading submission:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengunduh file'
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

        res.render('staff/formAddTugas', { 
            user: userData,  
            currentPage: '/staff/tugas' 
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
                staffQuery.where = {
                    [Op.and]: [
                        { '$role.roleName$': { [Op.ne]: 'Admin' } }, // Exclude Admin role
                        { userID: { [Op.ne]: req.user.userID } }    // Exclude current user
                    ]
                };
                break;
            
            case 'Kepala Bidang':
                // Kepala Bidang sees staff from same department and all programmers
                staffQuery.where = {
                    [Op.and]: [
                        { userID: { [Op.ne]: req.user.userID } },  // Exclude current user
                        {
                            [Op.or]: [
                                { deptID: currentUser.deptID },  // Same department
                                { '$role.roleName$': 'PROGRAMMER' },  // PROGRAMMER role
                                { 
                                    '$role.roleName$': 'Staff',
                                    '$dept.deptName$': 'PROGRAMMER'  // Staff in PROGRAMMER department
                                }
                            ]
                        }
                    ]
                };
                break;
            
            case 'Staff':
                if (currentUser.dept && currentUser.dept.deptName === 'PROGRAMMER') {
                    // Programmer staff can see all staff from all departments except themselves
                    staffQuery.where = {
                        [Op.and]: [
                            { '$role.roleName$': 'Staff' },  // Only see Staff role
                            { userID: { [Op.ne]: req.user.userID } },  // Exclude themselves
                            { '$role.roleName$': { [Op.ne]: 'Kepala Bidang' } }
                        ]
                    };
                } else {
                    // Regular staff sees other staff from same department and programmers
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
                            },
                            { '$role.roleName$': { [Op.ne]: 'Kepala Bidang' } }
                        ]
                    };
                }
                break;
            
            default:
                // For any other role, return empty list
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

const showRiwayat = async (req, res) => {
    try {
        const role = await User.findOne({
            where: { userID: req.user.userID },
            include: [{ model: Role, as: 'role' }]
        });

        const viewType = req.query.type || 'Tugas';

        let tasksQuery = {};

        if (viewType === 'Tugas') {
             if (role.role.roleName === 'Kepala Bidang') {
                const divisionUsers = await User.findAll({
                    where: { deptID: role.deptID },
                    attributes: ['userID']
                });

                const programmer = await User.findOne({
                    include: [{
                        model: Dept,
                        as: 'dept',
                        where: { deptName: 'PROGRAMMER' }
                    }],
                    attributes: ['userID']
                });

                const allowedAssignorIds = [
                    ...divisionUsers.map(user => user.userID),
                    programmer ? programmer.userID : null
                ].filter(id => id !== null);

                tasksQuery = {
                    where: {
                        assignorID: {
                            [Op.in]: allowedAssignorIds
                        }
                    },
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
            } else {
                tasksQuery = {
                    where: { assignorID: req.user.userID },
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
            }
        } else {
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
                        where: {
                            assigneeID: req.user.userID,
                            taskStatus: 'Selesai'
                        },
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
        }

        tasksQuery.order = [['createdAt', 'DESC']];
        
        const tasks = await Task.findAll(tasksQuery);

        const completedTasks = tasks.filter(task => {
            const breakdowns = task.breakdowns || [];
            if (viewType === 'Tugas') {
                return breakdowns.length > 0 && breakdowns.every(bd => bd.taskStatus === 'Selesai');
            } else {

                return breakdowns.length > 0;
            }
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

        res.render('staff/riwayat', {
            user: {
                username: role.username,
                jabatan: role.role ? role.role.roleName : ''
            },
            currentPage: '/staff/riwayat',
            tasks: formattedTasks,
            viewType: viewType
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
    showDaftarTugas, updateReadStatus, showFormProgresTugas, 
    showFormUpdateTugas, updateBreakdownStatus, downloadSubmission,
    showFormAddTugas, getStaffForAssignment,
    showRiwayat 
}