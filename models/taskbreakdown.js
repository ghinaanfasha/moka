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
        foreignKey: 'assigneeID',
        as: 'assignee'
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
    breakdownStatus: DataTypes.STRING,
    taskStatus: DataTypes.STRING,
    readStatus: DataTypes.STRING,
    readAt: {
      type: DataTypes.DATE,
      get() {
        const time = this.getDataValue('readAt');
        return time ? new Date(time) : null;
      }
    },
    submitTask: DataTypes.STRING,
    submitTime: {
      type: DataTypes.DATE,
      get() {
        // Memastikan data yang diambil sesuai timezone
        const time = this.getDataValue('submitTime');
        return time ? new Date(time) : null;
      }
    },
    taskNote: DataTypes.TEXT,
    feedback: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TaskBreakdown',
    tableName: 'taskBreakdowns',
    timestamps: true,
    timezone: '+07:00'
  });
  return TaskBreakdown;
};