const CONSTANTS = require("../../config/constants");

// TODO addd the task creator.
module.exports = function (sequelize, DataType) {
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

      /**
       * Checks if a task can be responded to by a user.
       *
       * @param cb callback function with params (error)
       */
      canAcceptNewResponses: function (cb) {
        const taskOwner = this.user;
        const expirationTime = new Date(this.expiresAt);
        const currentTime = new Date();
        const latestResponseTime = this.taskresponses.length > 0 ? this.taskresponses[0].createdAt : new Date(0); // if there is no prior taskResponse, create 1970 date.
        const nextAvailableTime = new Date(latestResponseTime.getTime());
        nextAvailableTime.setMinutes(latestResponseTime.getMinutes() + this.refreshRate);

        if (this.answersLeft === 0) { // task has been completed
          return cb(new Error("Task has already been completed."));
        }
        if (currentTime > expirationTime) { // task has expired
          return cb(new Error(`Task has expired at ${expirationTime}`));
        }
        if (taskOwner.balance - this.cost < 0) { // user does not enough money to pay
          return cb(new Error("The user does not have the funds to pay"));
        }
        if (currentTime < nextAvailableTime) { // task has been answered recently
          return cb(new Error(`Another user has recently answered the question. Next available time is ${nextAvailableTime}`));
        }

        cb(null);
      }
    }
  });

  return Task;
};
