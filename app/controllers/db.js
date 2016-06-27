const debug = require("debug")("app:controllers:db");
import express from "express";
import db from "../models";
import CONSTANTS, {ROUTES} from "../../config/constants";
import GCM from "../helpers/gcm";

const router = express.Router();
const gcm = new GCM();


/**
 * Returns middleware for checking if all required params have been provided for a request.
 *
 * @param requiredParams array of required params as strings
 * @returns {Function} middleware
 */
function checkRequiredParams(requiredParams) {
  debug("Checking within request for required params: ", requiredParams);

  return function (req, res, next) {
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
}


/**
 * Middleware to ensure that a user exists for the given userId.
 */
function ensureUserExists(req, res, next) {
  db[CONSTANTS.MODELS.USER].findUser(req.query.userId || req.body.userId, (error, user) => {
    if (error) return next(error);

    debug("Ensured user exists with info: ", user.dataValues);
    req.user = user; // set user onto req obj for next middlewares
    next();
  });
}


/**
 * Returns a promise that records status changes of tasks to the ChangeLog DB.
 * The ChangeLog DB is used whenever users sync with the server.
 *
 * @param taskId for task whose status is changing
 * @param status is one of CONSTANTS.HELPERS.CHANGE_LOG_STATUS_XXXXX
 * @returns {*|Object|Promise.<Instance>}
 */
function createChangeLogPromise(taskId, status) {
  debug(`Create change log promise for taskId=${taskId} with status=${status}`);

  return db[CONSTANTS.MODELS.CHANGE_LOG].create({
    taskId: taskId,
    status: status
  });
}


/**
 * POST: /db/task-add
 *
 * req: {
 *    // taskObj
 * }
 *
 * res: {
 *    "createdTaskId": taskId,
 *    "createdTaskActions": [{
 *        "id": taskActionId,
 *        "description": taskActionDescription,
 *        "type": type,
 *        "taskId": taskId,
 *        "updatedAt": timeString,
 *        "createdAt": timeString (e.g. "2016-06-23T19:37:47.135Z")
 *    }]
 * }
 */
const taskAddRequiredParams = ["taskName", "cost", "expiresAt", "refreshRate", "answersLeft", "locationName", "lat", "lng", "radius", "taskActions"];
router.post(CONSTANTS.ROUTES.DB.TASK_ADD, ensureUserExists, checkRequiredParams(taskAddRequiredParams), (req, res, next) => {
  debug("Requested to create task with following params: ", req.body);

  if (!parseFloat(req.body["cost"])) {
    return next(new Error("Cost must be a number (in dollars)."));
  }
  if (!parseFloat(req.body["lat"]) || !parseFloat(req.body["lng"])) {
    return next(new Error("Lat and Lng must both be numbers."));
  }

  db[CONSTANTS.MODELS.TASK].create({
    userId: req.body.userId,
    name: req.body.taskName,
    cost: req.body.cost,
    refreshRate: req.body.refreshRate,
    expiresAt: req.body.expiresAt,
    answersLeft: req.body.answersLeft,
    location: {
      name: req.body.locationName,
      lat: req.body.lat,
      lng: req.body.lng,
      radius: req.body.radius
    },
    taskactions: req.body.taskActions
  }, {
    include: [db[CONSTANTS.MODELS.TASK_ACTION], db[CONSTANTS.MODELS.LOCATION]]
  }).catch(error => {
    return next(error);
  }).then(createdTask => {
    createChangeLogPromise(createdTask.id, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_CREATED).then(() => {
      gcm.sendMessage({name: createdTask.name}, "all", (err, response) => {
        res.json({
          createdTaskId: createdTask.id,
          createdTaskActions: createdTask.taskactions
        });
      });
    }).catch(error => {
      return next(error);
    });
  });
});


/**
 * GET: /db/task-delete/:task_id
 *
 * req: {
 *    // TODO: change to POST
 * }
 *
 * res: {
 *    //
 * }
 */
router.get(CONSTANTS.ROUTES.DB.TASK_DELETE + "/:taskId", (req, res, next) => {
  const taskId = req.params.taskId;
  debug(`Deleting all data for taskId=${taskId}`);

  db[CONSTANTS.MODELS.TASK].destroy({
    where: {
      id: taskId
    },
    include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_RESPONSE]] // TODO: also destroy corresponding locations, taskactions, and taskactionresponses
  }).then(createChangeLogPromise(taskId, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_DELETED)).then(() => {
    res.redirect(CONSTANTS.ROUTES.INDEX);
  }).catch(error => {
    return next(error);
  });
});


/**
 * GET: /db/task-fetch
 *
 * req: {
 *    "taskId": [taskId]
 * }
 *
 * res: [{
 *    // taskObj
 * }]
 */
router.get(CONSTANTS.ROUTES.DB.TASK_FETCH, (req, res, next) => {
  let requestedFetchTaskIds;
  try {
    requestedFetchTaskIds = req.query.taskId ? JSON.parse(req.query.taskId) : [];
  } catch (error) {
    debug(error);
    requestedFetchTaskIds = [];
  }
  debug("Fetching task info for taskIds:", requestedFetchTaskIds);

  db[CONSTANTS.MODELS.TASK].findAll({
    where: {
      id: requestedFetchTaskIds
    },
    include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_RESPONSE], db[CONSTANTS.MODELS.TASK_ACTION]]
  }).then(fetchedTasks => {
    res.json(fetchedTasks);
  }).catch(error => {
    return next(error);
  });
});


/**
 * GET: /db/task-sync
 *
 * req: {
 *    "lastUpdated": unixtime (e.g. 1466710667155)
 * }
 *
 * res: {
 *    "lastUpdated": unixtime or 0 if no changes were made since queried time,
 *    "changes": [{
 *        "taskId": taskId,
 *        "status": status
 *    ]}
 * }
 */
router.get(CONSTANTS.ROUTES.DB.TASK_SYNC, (req, res, next) => {
  const changeLog = {
    lastUpdated: 0,
    changes: []
  };

  db[CONSTANTS.MODELS.CHANGE_LOG].findAll({
    where: {
      createdAt: {gt: new Date(1 * req.query.lastUpdated)}
    }
  }).then(allChanges => {
    if (allChanges.length > 0) {
      changeLog.lastUpdated = allChanges[allChanges.length - 1].createdAt.getTime(); // time of last change
      changeLog.changes = allChanges.map(changeObj => {
        return {taskId: changeObj.taskId, status: changeObj.status};
      });
    }

    debug("Sending changeLog:", changeLog);
    res.json(changeLog);
  }).catch(error => {
    return next(error);
  });
});


/**
 * POST: /db/task-respond
 *
 * req: {
 *    "userId": userId,
 *    "taskId": taskId,
 *    "responses": stringified JSON obj of {taskActionId: taskActionResponse}
 *    "taskActionIds": [taskActionId]
 * }
 *
 * res: {
 *    "error": "", // TODO: remove
 *    "result": true, // TODO: remove
 *    "balance": userBalance
 * }
 */
router.post(CONSTANTS.ROUTES.DB.TASK_RESPOND, ensureUserExists, checkRequiredParams(["taskId", "responses", "taskActionIds"]), (req, res, next) => {
  const user = req.user;
  const taskId = req.body.taskId;
  const taskActionResponses = JSON.parse(req.body.responses); // JSONObj {taskActionId: response} as a string
  const taskActionIdArray = JSON.parse(req.body.taskActionIds);
  debug(`Responding to taskId=${taskId} by userId=${user.id}`);

  db[CONSTANTS.MODELS.TASK].findOne({
    where: {id: taskId},
    include: [db[CONSTANTS.MODELS.USER], {model: db[CONSTANTS.MODELS.TASK_RESPONSE], order: '"createdAt" DESC'}]
  }).then(task => {
    if (task.answersLeft === 0) return next(new Error("Task is already completed."));  // no answers left

    task.acceptingNewResponses((error) => {
      if (error) return next(error);

      task.user.update({balance: task.user.balance - task.cost});
      user.update({balance: user.balance + task.cost});
      task.update({answersLeft: task.answersLeft - 1});

      db[CONSTANTS.MODELS.TASK_RESPONSE].create({
        userId: user.id,
        taskId: taskId
      }, {
        include: [db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]]
      }).catch(error => {
        return next(error);
      }).then((createdTaskResponse, err) => {
        db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE].bulkCreate(taskActionIdArray.map(id => {
          debug("Action ID: #" + id + " Response: " + taskActionResponses[id]);
          return {
            userId: user.id,
            response: taskActionResponses[id],
            taskactionId: id,
            taskresponseId: createdTaskResponse.id
          }
        })).then((newActions, err) => {
          createChangeLogPromise(taskId, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_UPDATED).then(() => {
            gcm.sendMessage({balance: task.user.balance, id: task.id}, task.user.gcmToken, (err, response) => {
              res.json({
                error: "",
                result: true,
                balance: user.balance
              });
            });
          });
        }).catch(error => {
          return next(error);
        });
      });
    });
  });
});


/**
 * GET: /db/response-fetch
 *
 * req: {
 *    "taskId": taskId
 * }
 *
 * res: {
 *    "error": "", // TODO: remove
 *    "responses": // [responseObj]
 * }
 */
router.get(CONSTANTS.ROUTES.DB.RESPONSE_FETCH, checkRequiredParams(["taskId"]), (req, res, next) => {
  const taskId = req.query.taskId;
  debug(`Fetching all task actions with taskId=${taskId}`);

  db[CONSTANTS.MODELS.TASK_RESPONSE].findAll({
    where: {taskId: taskId},
    include: [db[CONSTANTS.MODELS.USER], db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]]
  }).catch(error => {
    return next(error);
  }).then(fetchedResponses => {
    debug(`Fetched ${fetchedResponses.length} responses.`);
    res.json({error: "", responses: fetchedResponses});
  });
});


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
router.post(CONSTANTS.ROUTES.DB.USER_CREATE, checkRequiredParams(["userId"]), (req, res, next) => {
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
router.get(CONSTANTS.ROUTES.DB.USER_FETCH, ensureUserExists, (req, res, next) => {
  debug(`Fetching info of user with id=${req.user.id}`);

  res.json(req.user);
});

// error handling middleware only for current route
router.use((err, req, res, next) => {
  debug(err);
  res.status(err.status || 500).json({error: err.message});
});

export default function (app) {
  app.use("/", router);
};
