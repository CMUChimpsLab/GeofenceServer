import CONSTANTS from "../../config/constants";

export default function (sequelize, DataType) {
  const TaskAction = sequelize.define(CONSTANTS.MODELS.TASK_ACTION, {
    description: {type: DataType.STRING, allowNull: false},
    type: {type: DataType.STRING, allowNull: false}
  }, {
    classMethods: {
      associate: function (models) {
        TaskAction.belongsTo(models[CONSTANTS.MODELS.TASK], { // creates a `taskId` field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    }
  });

  return TaskAction;
};
