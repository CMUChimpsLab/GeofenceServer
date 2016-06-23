import CONSTANTS from "../../config/constants";

// TODO addd the task creator.
export default function (sequelize, DataType) {
  const Task = sequelize.define(CONSTANTS.MODELS.TASK, {
    name: {type: DataType.STRING, allowNull: false},
    cost: {type: DataType.DOUBLE, allowNull: false},
    refreshRate: {type: DataType.DOUBLE, allowNull: false},
    expiresAt: {type: DataType.DOUBLE, allowNull: true},
    answersLeft: {type: DataType.INTEGER, allowNull: false}
  }, {
    classMethods: {
      associate: function (models) {
        Task.hasOne(models[CONSTANTS.MODELS.LOCATION]);
        Task.hasMany(models[CONSTANTS.MODELS.TASK_ACTION]);
        Task.hasMany(models[CONSTANTS.MODELS.TASK_RESPONSE]);
        Task.belongsTo(models[CONSTANTS.MODELS.USER], { // creates a `userId` (= MODELS.USER + "Id") field
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    },
    instanceMethods: {
      acceptingNewResponses : function(cb) {
        //This function will check if a task has expired, the user has enough $, and the recency of the most recent entry
        var task = this;
        var requestingUser = task.user;
        var exp_time = new Date(task['expiresAt']);
        var now = new Date();
        var latestResponseTime =  new Date();
        latestResponseTime.setTime(1);
        if(task.taskresponses.length > 0) {
          latestResponseTime = task.taskresponses[0].createdAt  // if there is no prior taskResponse, create 1970 date.
        }
        var nextAvailableTime = new Date(latestResponseTime.getTime())
        nextAvailableTime.setMinutes(latestResponseTime.getMinutes() + task['refreshRate']);

        if (now > exp_time) { //check if the Task has expired
          return cb(new Error(`Task has expired at ${exp_time}`));
        }
        if (requestingUser.balance - task.cost < 0) { // check if the user has money to pay
          return cb(new Error("The user does not have the funds to pay"));
        }
        if (now < nextAvailableTime) { // check if it has been answered too recently
          return cb(new Error(`Another user has recently answered the question. Next available time is ${nextAvailableTime}`));
        }

        cb(null);
      }
    }
  });

  return Task;
};
