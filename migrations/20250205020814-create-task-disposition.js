'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('taskDispositions', {
      taskBreakdownID: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      nd_assigneeID: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      breakdownStatus: {
        type: Sequelize.STRING,
        defaultValue: "Belum selesai"
      },
      readStatus: {
        type: Sequelize.STRING,
        defaultValue: "Belum dibaca"
      },
      readAt: {
        type: Sequelize.DATE
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

    await queryInterface.addConstraint('taskDispositions', {
      fields: ['taskBreakdownID', 'nd_assigneeID'],
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
    await queryInterface.removeConstraint('taskDispositions', 'fk_taskDispositions_ndassignee');
    await queryInterface.dropTable('taskDispositions');
  }
};