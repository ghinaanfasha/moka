const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');
const { getAllUsers, addUser, deleteUser, editUser, updateUser } = require('../controllers/adminController'); 

const adminRouter = express.Router();

const checkAdminRole = (req, res, next) => {
    if (req.user.roleName !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};

adminRouter.get('/addUser', authMiddleware, checkAdminRole, getAllUsers, (req, res) => {
    if (!req.session.user) {
        return res.redirect('/')
    }
    res.render('addUser', {user: req.session.user});
});
adminRouter.post('/addUser', authMiddleware, checkAdminRole, addUser);
adminRouter.delete('/deleteUser/:id', authMiddleware, checkAdminRole, deleteUser);
adminRouter.get('/formEditUser/:id', authMiddleware, checkAdminRole, editUser);
adminRouter.put('/updateUser/:id', authMiddleware, checkAdminRole, updateUser);

module.exports = adminRouter;