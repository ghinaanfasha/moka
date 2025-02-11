'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Depts', [
      {
        deptName: 'SEKRETARIAT',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        deptName: 'P2EPD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        deptName: 'PPM',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        deptName: 'INFRASWIL',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        deptName: 'EKOSDA',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        deptName: 'PROGRAMMER',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Depts', null, {});
  }
};
