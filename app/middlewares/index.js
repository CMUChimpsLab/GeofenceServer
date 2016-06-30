const debug = require("debug")("app:middlewares");
const db = require("../models");
const CONSTANTS = require("../../config/constants");

/**
 * Returns middleware for checking if all required params have been provided for a request.
 *
 * @param requiredParams array of required params as strings
 * @returns {Function} middleware
 */
exports.checkRequiredParams = (requiredParams) => {
  debug("Checking within request for required params: ", requiredParams);

  return (req, res, next) => {
    // get params for either GET or POST request
    const params = Object.keys(req.query).length === 0 ? req.body : req.query;

    // check for each required param
    for (let i = 0; i < requiredParams.length; i++) {
      if (!params[requiredParams[i]]) {
        return next(new Error(`Missing required parameter: ${requiredParams[i]}`));
      }
    }

    next();
  };
};


/**
 * Middleware to ensure that a user exists for the given userId.
 */
exports.ensureUserExists = (req, res, next) => {
  db[CONSTANTS.MODELS.USER].findUser(req.query.userId || req.body.userId, (error, user) => {
    if (error) return next(error);

    debug("Ensured user exists with info: ", user.dataValues);
    req.user = user; // set user onto req obj for next middlewares
    next();
  });
};
