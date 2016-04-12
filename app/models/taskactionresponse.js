import CONSTANTS from "../../config/constants";

export default function (sequelize, DataType) {
  const TaskActionResponse = sequelize.define(CONSTANTS.MODELS.TASK_ACTION_RESPONSE, {
    response: DataType.STRING
  }, {
    classMethods: {
      associate: function (models) {
        TaskActionResponse.belongsTo(models[CONSTANTS.MODELS.USER], { // creates a `userId` field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
        TaskActionResponse.belongsTo(models[CONSTANTS.MODELS.TASK_RESPONSE], { // creates a `taskactionId` field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    },
    instanceMethods: {
      
    }
  });

  return TaskActionResponse;
}
