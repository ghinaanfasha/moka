const jsonWebToken = require("jsonwebtoken");
const db = require("../models");
const User = db.User;

const authMiddleware = async (req, res, next) => {
    try {
      let token = req.cookies.accessToken;

      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        return res.status(401).json({
          errors: ['No token provided'],
          message: 'Authentication failed',
          data: null
        });
      }

      try {
        const decoded = jsonWebToken.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({
          where: { userID: decoded.userID },
          include: ['role', 'dept']
        });

        if (!user) {
          return res.status(401).json({
            errors: ['User not found'],
            message: 'Authentication failed',
            data: null
          });
        }

        req.user = {
          userID: user.userID,
          username:user.username,
          roleID: user.roleID,
          roleName: user.role.roleName,
          deptID: user.deptID,
          deptName: user.dept ? user.dept.deptName : null
        };

        console.log('User in middleware:', req.user); 
        next();
      } catch (tokenError) {
        return res.status(401).json({
          errors: ['Invalid token'],
          message: 'Authentication failed',
          data: null
        });
      }
    } catch (error) {
      next(error);
    }
  };

module.exports = authMiddleware;