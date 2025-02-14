var express = require('express');
const { User, Role, Dept } = require('../models'); 
const authMiddleware = require('../middleware/authMiddleware.js');
const { getAllUsers } = require('../controllers/adminController'); 
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/dashboardStaf', (req, res) => {
  res.render('staff/dashboard'); 
});
router.get('/dashboard', (req, res) => {
  res.render('kepala/dashboard'); 
});
router.get('/formAddTugasStaf', (req, res) => {
  res.render('staff/formAddTugasStaf'); 
});
router.get('/detailTugas', (req, res) => {
  res.render('staff/detailTugas'); 
});
router.get('/infoProgresTugas', (req, res) => {
  res.render('kepala/infoProgresTugas'); 
});
router.get('/staffTugas', (req, res) => {
  res.render('staff/tugas'); 
});
router.get('/formUpdateStatus', (req, res) => {
  res.render('staff/formUpdateStatus'); 
});
router.get('/disposisiTugas', (req, res) => {
  res.render('staff/disposisiTugas'); 
});
router.get('/formProgresTugas', (req, res) => {
  res.render('staff/formProgresTugas'); 
});
router.get('/riwayat', (req, res) => {
  res.render('staff/riwayat'); 
});
router.get('/daftarTugas', (req, res) => {
  res.render('staff/daftarTugas'); 
});
router.get('/formProgres', (req, res) => {
  res.render('kepala/formProgres'); 
});
router.get('/formAddTugas', (req, res) => {
  res.render('kepala/formAddTugas'); 
});
router.get('/profil', (req, res) => {
  res.render('profil'); 
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