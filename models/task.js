'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, {
        foreignKey: 'assignorID',
        as: 'assignor'
      });
      Task.hasMany(models.TaskBreakdown, {
        foreignKey: 'taskID',
        as: 'breakdowns'
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
    deadline: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    timezone: '+07:00'
  });
  return Task;
};