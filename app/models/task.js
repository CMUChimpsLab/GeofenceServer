import CONSTANTS from "../../config/constants";

// TODO addd the task creator.
export default function (sequelize, DataType) {
  const Task = sequelize.define(CONSTANTS.MODELS.TASK, {
    name: {type: DataType.STRING, allowNull: false},
    cost: {type: DataType.DOUBLE, allowNull: false},
    expiresAt: {type: DataType.DATE, allowNull: true}
  }, {
    classMethods: {
      associate: function (models) {
        Task.hasOne(models[CONSTANTS.MODELS.LOCATION]);
        Task.hasMany(models[CONSTANTS.MODELS.TASK_ACTION]);
        Task.belongsTo(models[CONSTANTS.MODELS.USER], { // creates a `userId` (= MODELS.USER + "Id") field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    }
  });

  return Task;
};
