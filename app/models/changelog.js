import CONSTANTS from "../../config/constants";

export default function (sequelize, DataType) {
  const ChangeLog = sequelize.define(CONSTANTS.MODELS.CHANGE_LOG, {
    taskId: {type: DataType.STRING, allowNull: false},
    status: {type: DataType.STRING, allowNull: false}
  });

  return ChangeLog;
}
