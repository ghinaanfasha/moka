const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');
const upload = require('../middleware/upload.js');

const { getUser, 
    showTugas, showTaskProgress, updateTaskProgress,
    showDaftarTugas, updateReadStatus, showFormProgresTugas, 
    showFormUpdateTugas, updateBreakdownStatus,
    showFormAddTugas, getStaffForAssignment, addTask,
    getTaskForEdit, editTask, deleteTask,
    showRiwayat
} = require('../controllers/staffController'); 

const staffRouter = express.Router();

const checkStaffRole = (req, res, next) => {
    if (req.user.roleName !== 'Kepala Bidang' && req.user.roleName !== 'Staff') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};

staffRouter.get('/dashboard', authMiddleware, checkStaffRole, getUser, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

staffRouter.get('/tugas', authMiddleware, checkStaffRole, showTugas, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

staffRouter.get('/infoProgresTugas/:taskID', authMiddleware, checkStaffRole, showTaskProgress);
staffRouter.post('/updateTaskProgress', authMiddleware, checkStaffRole, updateTaskProgress);

staffRouter.get('/daftarTugas', authMiddleware, checkStaffRole, showDaftarTugas);
staffRouter.post('/updateReadStatus', authMiddleware, checkStaffRole, updateReadStatus);
staffRouter.get('/updateTask/:taskID', authMiddleware, checkStaffRole, showFormProgresTugas);
staffRouter.get('/updateTugas/:taskID/:breakdownID', authMiddleware, checkStaffRole, showFormUpdateTugas);
staffRouter.post('/updateTugas/:taskID/:breakdownID', authMiddleware, checkStaffRole, updateBreakdownStatus);

staffRouter.get('/formAddTugas', authMiddleware, checkStaffRole, showFormAddTugas, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
staffRouter.get('/get-staff-for-assignment', authMiddleware, checkStaffRole, getStaffForAssignment);
staffRouter.post('/add-task', upload.single('dokumen'), authMiddleware, checkStaffRole, addTask);
staffRouter.get('/edit-task/:taskId', authMiddleware, checkStaffRole, getTaskForEdit);
staffRouter.post('/edit-task/:taskId', upload.single('dokumen'), authMiddleware, checkStaffRole, editTask);
staffRouter.delete('/delete-task/:taskId', authMiddleware, checkStaffRole, deleteTask);
staffRouter.get('/riwayat', authMiddleware, checkStaffRole, showRiwayat, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = staffRouter;