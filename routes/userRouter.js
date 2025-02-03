// routes/userRouter.js

const express = require("express");
const { login } = require("../controllers/userController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const userRouter = express.Router();

userRouter.post("/login", login);

userRouter.get("/dashboard", authMiddleware, (req, res) => {
  const { roleName } = req.user;

  switch(roleName) {
    case 'admin':
      res.json({ message: 'Admin Dashboard', routes: ['users', 'roles'] });
      break;
    case 'Kepala BAPPEDA':
      res.json({ message: 'Kepala BAPPEDA Dashboard', routes: ['tasks', 'reports'] });
      break;
    case 'Kepala Bidang':
      res.json({ message: 'Kepala Bidang Dashboard', routes: ['departmentTasks'] });
      break;
    case 'Staff':
      res.json({ message: 'Staff Dashboard', routes: ['myTasks'] });
      break;
    default:
      res.status(403).json({ message: 'Unauthorized' });
  }
});

module.exports = userRouter;