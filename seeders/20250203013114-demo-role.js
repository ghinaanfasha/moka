'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Roles', [
      {
        roleName: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        roleName: 'Kepala BAPPEDA',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        roleName: 'Kepala Bidang',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        roleName: 'Staff',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Roles', null, {});
  }
};
