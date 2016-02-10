import CONSTANTS from "../../config/constants";

// TODO add credit to the user when they finish a task.
// and I guess remove it from the task creator.
export default function (sequelize, DataType) {
  const User = sequelize.define(CONSTANTS.MODELS.USER, {
    id: {type: DataType.STRING, primaryKey: true, allowNull: false},
    gcmToken: DataType.STRING
  }, {
    classMethods: {
      associate: function (models) {
        User.hasMany(models[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]);
      }
    }
  });

  return User;
}
