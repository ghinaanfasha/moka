var express = require('express');
const { User, Role, Dept } = require('../models'); 
const authMiddleware = require('../middleware/authMiddleware.js');
const { getAllUsers } = require('../controllers/adminController'); 
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/addUser', authMiddleware, async (req, res) => {
  try {
      await getAllUsers(req, res);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/formAddUser', authMiddleware, async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['roleID', 'roleName']
    });

    const departments = await Dept.findAll({
      attributes: ['deptID', 'deptName']
    });

    const admin = await User.findOne({
      where: { userID: req.user.userID },
      include: [{ model: Role, as: 'role' }] 
    });

    res.render('admin/formAddUser', { 
      roles: roles,
      departments: departments,
      user: {
        username: admin?.username,
        jabatan: admin?.role?.roleName
      } 
    });
  } catch (error) {
    console.error('Error fetching roles and departments:', error);
    res.status(500).render('error', { 
      message: 'Internal Server Error', 
      error: error 
    });
  }
});

module.exports = router;