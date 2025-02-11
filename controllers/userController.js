const db = require("../models");
const User = db.User;
const { comparePassword } = require("../utils/bcrypt.js");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt.js");
const { dataValid } = require("../validation/dataValidation.js");

const login = async (req, res, next) => {
    try {
      const valid = {
        username: "required",
        password: "required"
      };

      const validationResult = await dataValid(valid, req.body);

      if (validationResult.message.length > 0) {
        return res.status(400).json({
          errors: validationResult.message,
          message: "Login Failed",
          data: null
        });
      }

      const { username, password } = validationResult.data;

      const user = await User.findOne({
        where: { username },
        include: ['role', 'dept']
      });

      if (!user) {
        return res.status(404).json({
          errors: ['User not found'],
          message: "Username atau Password Salah",
          data: null
        });
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          errors: ['Invalid credentials'],
          message: "Username atau Password Salah",
          data: null
        });
      }

      const tokenPayload = {
        userID: user.userID,
        roleID: user.roleID,
        roleName: user.role.roleName,
        deptID: user.deptID,
        deptName: user.dept ? user.dept.deptName : null
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000 
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });

      let redirectUrl;
      switch (user.role.roleName) {
        case 'admin':
          redirectUrl = '/addUser';
          break;
        case 'Kepala BAPPEDA':
          redirectUrl = '/kepala/dashboard';
          break;
        case 'Staff':
          redirectUrl = '/dashboard';
          break;
        default:
          redirectUrl = '/';
      }

      return res.status(200).json({
        message: "Login successful",
        data: {
          redirectUrl,
          user: {
            userID: user.userID,
            username: user.username,
            roleName: user.role.roleName,
            department: user.dept ? user.dept.deptName : null
          }
        }
      });

    } catch (error) {
      console.error('Error during login:', error);
      next(error);
    }
  };

module.exports = { login };