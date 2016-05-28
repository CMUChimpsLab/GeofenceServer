import CONSTANTS from "../../config/constants";

// TODO addd the task creator.
export default function (sequelize, DataType) {
  const TaskResponse = sequelize.define(CONSTANTS.MODELS.TASK_RESPONSE, {
    createdAt: {type: DataType.DOUBLE, allowNull: true}
  }, {
    classMethods: {
      associate: function (models) {
        TaskResponse.belongsTo(models[CONSTANTS.MODELS.USER]);
        TaskResponse.hasMany(models[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]);
        TaskResponse.belongsTo(models[CONSTANTS.MODELS.TASK], {
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    }
  });

  return TaskResponse;
};
