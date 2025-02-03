'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dept extends Model {
    static associate(models) {
      Dept.hasMany(models.User, {
        foreignKey: 'deptID',
        as: 'users'
      });
    }
  }
  Dept.init({
    deptID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deptName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Dept',
    tableName: 'depts' 
  });
  return Dept;
};
