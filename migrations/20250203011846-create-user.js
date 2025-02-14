'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      userID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      roleID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      deptID: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING
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

    await queryInterface.addConstraint('users', {
      fields: ['roleID'],
      type: 'foreign key',
      name: 'fk_users_roles',
      references: {
        table: 'roles',
        field: 'roleID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('users', {
      fields: ['deptID'],
      type: 'foreign key',
      name: 'fk_users_depts',
      references: {
        table: 'depts',
        field: 'deptID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('users', 'fk_users_roles');
    await queryInterface.removeConstraint('users', 'fk_users_depts');
    await queryInterface.dropTable('users');
  }
};
