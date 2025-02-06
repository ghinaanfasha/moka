'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: 'roleID',
        as: 'users'
      });
    }
  }
  Role.init({
    roleID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roleName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles' 
  });
  return Role;
};
