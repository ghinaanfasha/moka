'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      taskID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      assignorID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      assigneeID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      taskName: {
        type: Sequelize.STRING
      },
      taskDesc: {
        type: Sequelize.TEXT
      },
      taskFile: {
        type: Sequelize.STRING
      },
      deadline: {
        type: Sequelize.DATE
      },
      readStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "Diberikan"
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

    await queryInterface.addConstraint('tasks', {
      fields: ['assignorID'],
      type: 'foreign key',
      name: 'fk_tasks_assignor',
      references: {
        table: 'users',
        field: 'userID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('tasks', {
      fields: ['assigneeID'],
      type: 'foreign key',
      name: 'fk_tasks_assignee',
      references: {
        table: 'users',
        field: 'userID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('tasks', 'fk_tasks_assignor');
    await queryInterface.removeConstraint('tasks', 'fk_tasks_assignee');
    await queryInterface.dropTable('tasks');
  }
};