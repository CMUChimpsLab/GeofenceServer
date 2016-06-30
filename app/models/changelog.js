const CONSTANTS = require("../../config/constants");

module.exports = function (sequelize, DataType) {
  const ChangeLog = sequelize.define(CONSTANTS.MODELS.CHANGE_LOG, {
    taskId: {type: DataType.STRING, allowNull: false},
    status: {type: DataType.STRING, allowNull: false}
  });

  return ChangeLog;
};
