const bcrypt = require('bcryptjs');
const { User, Role, Dept } = require('../models');
const { Op } = require('sequelize');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [
                { model: Role, as: 'role', attributes: ['roleName'] },
                { model: Dept, as: 'dept', attributes: ['deptName'] }
            ],
            attributes: ['userID', 'username']
        });

        const admin = await User.findOne({
            where: { userID: req.user.userID },
            include: [{ model: Role, as: 'role' }]
        });

        const formattedUsers = users.map(user => ({
            id: user.userID,
            username: user.username,
            jabatan: user.role ? user.role.roleName : '-',
            bidang: user.dept ? user.dept.deptName : '-'
        }));

        res.render('admin/addUser', { 
            users: formattedUsers,
            user: {
                username: admin.username,
                jabatan: admin.role ? admin.role.roleName : ''
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('error', { 
            message: 'Internal Server Error', 
            error: error 
        });
    }
};

const addUser = async (req, res) => {
    try {
        const { username, password, confirmPassword, jabatan, bidang } = req.body;

        const existingUser = await User.findOne({ 
            where: { username } 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password tidak cocok'
            });
        }

        const role = await Role.findOne({ 
            where: { roleName: jabatan } 
        });

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role tidak valid'
            });
        }

        let deptID = null;
        if (bidang) {
            const dept = await Dept.findOne({ 
                where: { deptName: bidang } 
            });
            if (dept) {
                deptID = dept.deptID;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            password: hashedPassword,
            roleID: role.roleID,
            deptID: deptID
        });

        return res.status(200).json({
            success: true,
            message: 'User berhasil ditambahkan'
        });

    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menambahkan user: ' + error.message
        });
    }
}; 


const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User tidak ditemukan' 
            });
        }

        if (user.role && user.role.jabatan === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'User dengan role Admin tidak dapat dihapus'
            });
        }

        await user.destroy();
        
        return res.status(200).json({ 
            success: true, 
            message: 'Pengguna berhasil dihapus' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Gagal menghapus pengguna: ' + error.message 
        });
    }
};

const editUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const userToEdit = await User.findOne({
            where: { userID: userId },
            include: [
                { model: Role, as: 'role' },
                { model: Dept, as: 'dept' }
            ]
        });

        if (!userToEdit) {
            return res.status(404).render('error', {
                message: 'User tidak ditemukan'
            });
        }

        const admin = await User.findOne({
            where: { userID: req.user.userID },
            include: [{ model: Role, as: 'role' }]
        });

        const roles = await Role.findAll();
        const departments = await Dept.findAll();

        return res.render('admin/formEditUser', {
            user: {
                username: admin.username,
                jabatan: admin.role ? admin.role.roleName : ''  
            },
            userToEdit: {
                id: userToEdit.userID,
                username: userToEdit.username,
                roleId: userToEdit.roleID,
                deptId: userToEdit.deptID,
                roleName: userToEdit.role ? userToEdit.role.roleName : '',
                deptName: userToEdit.dept ? userToEdit.dept.deptName : ''
            },
            roles: roles,
            departments: departments
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).render('error', {
            message: 'Error fetching user data'
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, password, jabatan, bidang } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        const existingUser = await User.findOne({ 
            where: { 
                username,
                userID: { [Op.ne]: userId } 
            } 
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan'
            });
        }

        const role = await Role.findOne({ where: { roleName: jabatan } });
        
        const updateData = {
            username: username,
            roleID: role ? role.roleID : user.roleID,
            deptID: null
        };

        if (bidang && bidang !== '') {
            const dept = await Dept.findOne({ where: { deptName: bidang } });
            if (dept) {
                updateData.deptID = dept.deptID;
            }
        }

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);

        return res.status(200).json({
            success: true,
            message: 'User berhasil diupdate'
        });

    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengupdate user: ' + error.message
        });
    }
};

module.exports = { getAllUsers, addUser, deleteUser, editUser, updateUser };