'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('taskDispositions', {
      taskBreakdownID: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      assigneeID: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      nd_assigneeID: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      readStatus: {
        type: Sequelize.STRING
      },
      readAt: {
        type: Sequelize.DATE
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

    await queryInterface.addConstraint('taskDispositions', {
      fields: ['taskBreakdownID', 'assigneeID'],
      type: 'primary key',
      name: 'pk_taskDispositions'
    });

    await queryInterface.addConstraint('taskDispositions', {
      fields: ['taskBreakdownID'],
      type: 'foreign key',
      name: 'fk_taskDispositions_taskBreakdowns',
      references: {
        table: 'taskBreakdowns',
        field: 'taskBreakdownID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('taskDispositions', {
      fields: ['assigneeID'],
      type: 'foreign key',
      name: 'fk_taskDispositions_assignee',
      references: {
        table: 'users',
        field: 'userID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('taskDispositions', {
      fields: ['nd_assigneeID'],
      type: 'foreign key',
      name: 'fk_taskDispositions_ndassignee',
      references: {
        table: 'users',
        field: 'userID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('taskDispositions', 'fk_taskDispositions_taskBreakdowns');
    await queryInterface.removeConstraint('taskDispositions', 'fk_taskDispositions_assignee');
    await queryInterface.removeConstraint('taskDispositions', 'fk_taskDispositions_ndassignee');
    await queryInterface.dropTable('taskDispositions');
  }
};