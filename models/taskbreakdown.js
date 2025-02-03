'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskBreakdown extends Model {
    static associate(models) {
      TaskBreakdown.belongsTo(models.Task, {
        foreignKey: 'taskID',
        as: 'task'
      });

      TaskBreakdown.belongsTo(models.User, {
        foreignKey: 'userID',
        as: 'user'
      });
    }
  }
  TaskBreakdown.init({
    taskBreakdownID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    taskID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    assigneeID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    taskBreakdown: DataTypes.TEXT,
    readStatus: DataTypes.BOOLEAN,
    readAt: DataTypes.DATE,
    submitTask: DataTypes.STRING,
    submitTime: DataTypes.DATE,
    breakdownStatus: DataTypes.STRING,
    taskNote: DataTypes.TEXT,
    feedback: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TaskBreakdown',
    tableName: 'taskBreakdowns'
  });
  return TaskBreakdown;
};