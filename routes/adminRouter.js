// routes/adminRouter.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');

const adminRouter = express.Router();

const checkAdminRole = (req, res, next) => {
    if (req.user.roleName !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};

adminRouter.use(authMiddleware);
adminRouter.use(checkAdminRole);

adminRouter.get('/addUser', (req, res) => {
    res.render('admin/addUser', { user: req.user });
});

module.exports = adminRouter;