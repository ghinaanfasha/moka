const { User, Role, Dept } = require('../models');

const profileController = {
    showProfile: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.userID, {
                include: [
                    { model: Role, as: 'role', attributes: ['roleName'] },
                    { model: Dept, as: 'dept', attributes: ['deptName'] }
                ]
            });

            let backLink;
            let navTemplate;
            
            switch(user.role.roleName.toLowerCase()) {
                case 'admin':
                    backLink = '/addUser';
                    navTemplate = './layout/navAdmin';
                    break;
                case 'kepala bappeda':
                    backLink = '/kepala/dashboard';
                    navTemplate = './layout/navKepala';
                    break;
                case 'kepala bidang':
                    backLink = '/staff/dashboard';
                    navTemplate = './layout/navStaf';
                    break;
                case 'staff':
                    backLink = '/staff/dashboard';
                    navTemplate = './layout/navStaf';
                    break;
                default:
                    backLink = '/';
                    navTemplate = './layout/nav';
            }

            res.render('profil', {
                user: {
                    username: user.username,
                    jabatan: user.role.roleName,
                    deptName: user.dept ? user.dept.deptName : '-'
                },
                backLink: backLink,
                navTemplate: navTemplate,
                currentPage: '/profil'
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).render('error', { 
                message: 'Internal Server Error', 
                error: error 
            });
        }
    },

    logout: async (req, res) => {
        try {
            console.log("Attempting logout for user:", req.user?.username);
            console.log("Session before logout:", req.session);

            if (!req.session) {
                console.log("No session found");
                return res.status(400).json({ message: "No active session found" });
            }

            await new Promise((resolve, reject) => {
                req.session.destroy(err => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.redirect('/');
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ 
                message: 'Logout failed', 
                error: error.message 
            });
        }
    }
};

module.exports = profileController;