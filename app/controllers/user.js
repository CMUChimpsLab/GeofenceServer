const debug = require("debug")("app:controllers:db");
const db = require("../models");
const CONSTANTS = require("../../config/constants");
const router = require("express").Router();
const middlewares = require("../middlewares");


/**
 * POST: /db/user-create
 *
 * req: {
 *    "userId": id,
 *    "gcmToken": gcmToken, (optional)
 *    "balance": balance (optional, will default to DEFAULT_BALANCE)
 * }
 *
 * res: {
 *    "error": "", // TODO: remove
 *    "result": false if user already existed and only gcmToken was updated or true otherwise
 * }
 */
router.post(CONSTANTS.ROUTES.DB.USER_CREATE, middlewares.checkRequiredParams(["userId"]), (req, res, next) => {
  const {userId, balance, gcmToken} = req.body;
  debug(`Creating or updating user with userId=${userId}, balance=${balance}, gcmToken=${gcmToken}`);

  db[CONSTANTS.MODELS.USER].createOrUpdateUser(userId, balance, gcmToken, (error, result) => {
    if (error) return next(error);
    res.json({error: "", result: result});
  });
});


/**
 * GET: /db/user-fetch
 *
 * req: {
 *    "userId": userId
 * }
 *
 * res: {
 *    "id": userId,
 *    "balance": balance,
 *    "gcmToken": gcmToken or null if not provided,
 *    "createdAt": timeString,
 *    "updatedAt": timeString (e.g. "2016-06-23T19:37:47.135Z")
 * }
 */
router.get(CONSTANTS.ROUTES.DB.USER_FETCH, middlewares.ensureUserExists, (req, res, next) => {
  debug(`Fetching info of user with id=${req.user.id}`);

  res.json(req.user);
});

// error handling middleware only for current route
router.use((err, req, res, next) => {
  debug(err);
  res.status(err.status || 500).json({error: err.message});
});

module.exports = function (app) {
  app.use("/", router);
};
