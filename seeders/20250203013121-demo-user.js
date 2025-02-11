'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminRole = await queryInterface.sequelize.query(
      `SELECT roleID from roles WHERE roleName = 'admin' LIMIT 1;`
    );

    const adminRoleId = adminRole[0][0].roleID;

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await queryInterface.bulkInsert('users', [{
      roleID: adminRoleId,
      username: 'admin',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  }
};