'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('taskBreakdowns', {
      taskBreakdownID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      taskID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      taskBreakdown: {
        type: Sequelize.TEXT
      },
      submitTask: {
        type: Sequelize.STRING
      },
      submitTime: {
        type: Sequelize.DATE
      },
      breakdownStatus: {
        type: Sequelize.STRING,
        defaultValue: "Belum dikerjakan"
      },
      taskNote: {
        type: Sequelize.TEXT
      },
      feedback: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addConstraint('taskBreakdowns', {
      fields: ['taskID'],
      type: 'foreign key',
      name: 'fk_taskBreakdowns_tasks',
      references: {
        table: 'tasks',
        field: 'taskID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('taskBreakdowns', 'fk_taskBreakdowns_tasks');
    await queryInterface.dropTable('taskBreakdowns');
  }
};