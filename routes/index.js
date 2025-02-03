var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/formEditUser', (req, res) => {
  res.render('admin/formEditUser'); // Perbaiki path ke folder admin
});
router.get('/profil', (req, res) => {
  res.render('profil'); // Perbaiki path ke folder admin
});
router.get('/formAddUser', (req, res) => {
  res.render('admin/formAddUser'); // Perbaiki path ke folder admin
});
router.get('/addUser', (req, res) => {
  res.render('admin/addUser'); // Perbaiki path ke folder admin
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
