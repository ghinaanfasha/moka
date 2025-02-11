const express = require("express");
const { login } = require("../controllers/userController.js");

const userRouter = express.Router();

userRouter.post("/login", login);

module.exports = userRouter;