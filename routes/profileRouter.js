const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

const profileRouter = express.Router();

profileRouter.get('/', authMiddleware, profileController.showProfile);
profileRouter.post('/logout', authMiddleware, profileController.logout);

profileRouter.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal logout' });
      }
      res.clearCookie('connect.sid');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.redirect('/');
    });
});

module.exports = profileRouter;