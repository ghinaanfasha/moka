const { User, Role, Dept } = require('../models');

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

        res.render('kepala/tugas', { 
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

const showRiwayat = async (req, res) => {
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

        res.render('kepala/riwayat', { 
            user: userData,  
            currentPage: '/kepala/riwayat' 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('error', { 
            message: 'Internal Server Error', 
            error: error 
        });
    }
};

module.exports = { getUser, showTugas, showRiwayat };