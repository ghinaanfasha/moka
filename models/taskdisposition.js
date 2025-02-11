'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskDisposition extends Model {
    static associate(models) {
      TaskDisposition.belongsTo(models.TaskBreakdown, {
        foreignKey: 'taskBreakdownID',
        as: 'taskBreakdown'
      });

      TaskDisposition.belongsTo(models.User, {
        foreignKey: 'assigneeID',
        as: 'assignee'
      });

      TaskDisposition.belongsTo(models.User, {
        foreignKey: 'nd_assigneeID',
        as: 'ndAssignee'
      });
    }
  }
  TaskDisposition.init({
    taskBreakdownID: DataTypes.INTEGER,
    assigneeID: DataTypes.INTEGER,
    nd_assigneeID: DataTypes.INTEGER,
    readStatus: DataTypes.STRING,
    readAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'TaskDisposition',
    tableName: 'taskDispositions'
  });
  return TaskDisposition;
};