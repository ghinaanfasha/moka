// middleware/roleMiddleware.js

const authMiddleware = require('../middleware/authMiddleware.js');

// Route untuk dashboard admin
app.get('/admin-dashboard', authMiddleware, (req, res) => {
    if (req.user.roleName !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.render('admin-dashboard', { user: req.user });
});

// Route untuk dashboard Kepala BAPPEDA
app.get('/kepala-bappeda-dashboard', authMiddleware, (req, res) => {
    if (req.user.roleName !== 'Kepala BAPPEDA') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.render('kepala-bappeda-dashboard', { user: req.user });
});

// Route untuk dashboard Kepala Bidang
app.get('/kepala-bidang-dashboard', authMiddleware, (req, res) => {
    if (req.user.roleName !== 'Kepala Bidang') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.render('kepala-bidang-dashboard', { user: req.user });
});

// Route untuk dashboard Staff
app.get('/staff-dashboard', authMiddleware, (req, res) => {
    if (req.user.roleName !== 'Staff') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.render('staff-dashboard', { user: req.user });
});