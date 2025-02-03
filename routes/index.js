var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/formAddTugas', (req, res) => {
  res.render('kepala/formAddTugas'); 
});
router.get('/tugas', (req, res) => {
  res.render('kepala/tugas'); 
});
router.get('/formEditUser', (req, res) => {
  res.render('admin/formEditUser'); 
});
router.get('/profil', (req, res) => {
  res.render('profil'); 
});
router.get('/formAddUser', (req, res) => {
  res.render('admin/formAddUser'); 
});
router.get('/addUser', (req, res) => {
  res.render('admin/addUser');
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login', error: null });
});

/* POST login page. */
router.post('/login', function(req, res, next) {
  const { username, password } = req.body;

  // Contoh validasi sederhana
  if (username === 'admin' && password === 'password') {
    req.session.user = { username }; // Simpan sesi pengguna
    res.render('login', { title: 'Login', error: null, success: 'Login berhasil!' });
  } else {
    res.render('login', { title: 'Login', error: 'Username atau password salah!' });
  }
});


module.exports = router;
