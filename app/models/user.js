const CONSTANTS = require("../../config/constants");

module.exports = function (sequelize, DataType) {
  const User = sequelize.define(CONSTANTS.MODELS.USER, {
    id: {type: DataType.STRING, primaryKey: true, allowNull: false},
    balance: {type: DataType.DOUBLE, defaultValue: 20},
    gcmToken: DataType.STRING
  }, {
    classMethods: {
      associate: function (models) {
        User.hasMany(models[CONSTANTS.MODELS.TASK_RESPONSE]);
        User.hasMany(models[CONSTANTS.MODELS.TASK]);
      },

      /**
       * Creates or updates a user for the given userId.
       * If a user for the given userId already exists, the balance and gcmToken for the existing user will be updated.
       *
       * @param userId
       * @param balance
       * @param gcmToken
       * @param cb callback function with params (error, result), where result is true if user was newly created or false if user already existed
       */
      createOrUpdateUser: function (userId, balance, gcmToken, cb) {
        User.findOrCreate({
          where: {id: userId}
        }).catch(error => {
          cb(error);
        }).then(userCreateResult => {
          // update balance
          if (balance) userCreateResult[0].update({balance: balance});
          // update gcmToken
          if (gcmToken) userCreateResult[0].update({gcmToken: gcmToken});

          cb(null, userCreateResult[1]);
        });
      },

      /**
       * Finds a user for the given userId.
       *
       * @param userId
       * @param cb callback function with params (error, user)
       */
      findUser: function (userId, cb) {
        User.findOne({
          where: {id: userId}
        }).then(user => {
          if (!user) return cb(new Error("Requested user does not exist."));
          cb(null, user);
        }).catch(error => {
          cb(error);
        });
      }
    }
  });

  return User;
}
