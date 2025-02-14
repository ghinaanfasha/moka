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
      assigneeID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      taskBreakdown: {
        type: Sequelize.TEXT
      },
      breakdownStatus: {
        type: Sequelize.STRING,
        defaultValue: "Belum selesai"
      },
      taskStatus: {
        type: Sequelize.STRING,
        defaultValue: "Diberikan"
      },
      readStatus: {
        type: Sequelize.STRING,
        defaultValue: "Belum dibaca"
      },
      readAt: {
        type: Sequelize.DATE
      },
      submitTask: {
        type: Sequelize.STRING
      },
      submitTime: {
        type: Sequelize.DATE
      },
      taskNote: {
        type: Sequelize.TEXT
      },
      feedback: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')  
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')  
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

    await queryInterface.addConstraint('taskBreakdowns', {
      fields: ['assigneeID'],
      type: 'foreign key',
      name: 'fk_taskBreakdowns_assignee',
      references: {
        table: 'users',
        field: 'userID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('taskBreakdowns', 'fk_taskBreakdowns_tasks');
    await queryInterface.removeConstraint('taskBreakdowns', 'fk_taskBreakdowns_assignee');
    await queryInterface.dropTable('taskBreakdowns');
  }
};