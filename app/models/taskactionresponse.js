const CONSTANTS = require("../../config/constants");

module.exports = function (sequelize, DataType) {
  const TaskActionResponse = sequelize.define(CONSTANTS.MODELS.TASK_ACTION_RESPONSE, {
    response: DataType.STRING
  }, {
    classMethods: {
      associate: function (models) {
        TaskActionResponse.belongsTo(models[CONSTANTS.MODELS.USER], { // creates a `userId` field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
        TaskActionResponse.belongsTo(models[CONSTANTS.MODELS.TASK_RESPONSE], { // creates a `taskresponseId` field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
        TaskActionResponse.belongsTo(models[CONSTANTS.MODELS.TASK_ACTION], { // creates a `taskactionId` field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    },
    instanceMethods: {}
  });

  return TaskActionResponse;
};
