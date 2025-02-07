'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskBreakdown extends Model {
    static associate(models) {
      TaskBreakdown.belongsTo(models.Task, {
        foreignKey: 'taskID',
        as: 'task'
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
    taskBreakdown: DataTypes.TEXT,
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