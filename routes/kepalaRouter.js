const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');
const { getUser, showTugas, showRiwayat } = require('../controllers/kepalaController'); 

const kepalaRouter = express.Router();

const checkKepalaRole = (req, res, next) => {
    if (req.user.roleName !== 'Kepala BAPPEDA') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};

kepalaRouter.get('/dashboard', authMiddleware, checkKepalaRole, getUser, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
kepalaRouter.get('/tugas', authMiddleware, checkKepalaRole, showTugas, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
kepalaRouter.get('/riwayat', authMiddleware, checkKepalaRole, showRiwayat, async (req, res) => {
    try {
        await getUser(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = kepalaRouter;