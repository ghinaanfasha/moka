const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');
const upload = require('../middleware/upload.js');

const { getUser, showTugas, showTaskProgress,
        updateTaskProgress, showFormAddTugas, 
        showRiwayat ,getStaffForAssignment, addTask, 
        getTaskForEdit, editTask, deleteTask
    } = require('../controllers/kepalaController'); 

const kepalaRouter = express.Router();

const checkKepalaRole = (req, res, next) => {
    if (req.user.roleName !== 'Kepala BAPPEDA') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};

kepalaRouter.get('/dashboard', authMiddleware, checkKepalaRole, getUser);
kepalaRouter.get('/dashboard/data', authMiddleware, checkKepalaRole, getUser);
kepalaRouter.get('/tugas', authMiddleware, checkKepalaRole, showTugas, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
kepalaRouter.get('/infoProgresTugas/:taskID', authMiddleware, checkKepalaRole, showTaskProgress);
kepalaRouter.post('/updateTaskProgress', authMiddleware, checkKepalaRole, updateTaskProgress);
kepalaRouter.get('/formAddTugas', authMiddleware, checkKepalaRole, showFormAddTugas, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
kepalaRouter.get('/get-staff-for-assignment', authMiddleware, checkKepalaRole, getStaffForAssignment);
kepalaRouter.post('/add-task', upload.single('dokumen'), authMiddleware, checkKepalaRole, addTask);
kepalaRouter.get('/edit-task/:taskId', authMiddleware, checkKepalaRole, getTaskForEdit);
kepalaRouter.post('/edit-task/:taskId', upload.single('dokumen'), authMiddleware, checkKepalaRole, editTask);
kepalaRouter.delete('/delete-task/:taskId', authMiddleware, checkKepalaRole, deleteTask);
kepalaRouter.get('/riwayat', authMiddleware, checkKepalaRole, showRiwayat, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = kepalaRouter;