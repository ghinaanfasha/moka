'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, {
        foreignKey: 'userID',
        as: 'user'
      });
    }
  }
  Task.init({
    taskID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assignorID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    taskName: DataTypes.STRING,
    taskDesc: DataTypes.TEXT,
    taskFile: DataTypes.STRING,
    deadline: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks'
  });
  return Task;
};