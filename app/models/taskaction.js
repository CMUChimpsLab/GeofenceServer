import CONSTANTS from "../../config/constants";

export default function (sequelize, DataType) {
  const TaskAction = sequelize.define(CONSTANTS.MODELS.TASK_ACTION, {
    description: {type: DataType.STRING, allowNull: false},
    type: {type: DataType.STRING, allowNull: false}
  }, {
    classMethods: {
      associate: function (models) {
        TaskAction.belongsTo(models[CONSTANTS.MODELS.TASK], {
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
        TaskAction.hasMany(models[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]);
      }
    }
  });

  return TaskAction;
};
