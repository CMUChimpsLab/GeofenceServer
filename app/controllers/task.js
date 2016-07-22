const debug = require("debug")("app:controllers:db");
const db = require("../models");
const CONSTANTS = require("../../config/constants");
const router = require("express").Router();
const middlewares = require("../middlewares");
const GCM = require("../helpers/gcm");
const gcm = new GCM();


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
 *    "userId": userId,
 *    "taskName": taskName,
 *    "cost": cost,
 *    "expiresAt": expiresAt in epoch time,
 *    "refreshRate": refreshRate in minutes,
 *    "answersLeft": answersLeft (-1 to have unlimited answers),
 *    "locationName": locationName,
 *    "lat": lat,
 *    "lng": lng,
 *    "radius": radius in meters,
 *    "taskActions[n][description]": taskActionDescription for taskAction #n,
 *    "taskActions[n][type]": taskActionType for taskAction #n
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
router.post(CONSTANTS.ROUTES.DB.TASK_ADD, middlewares.ensureUserExists, middlewares.checkRequiredParams(taskAddRequiredParams), (req, res, next) => {
  
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  debug("Requested to create task with following params: ", req.body);
  const {taskName, cost, refreshRate, expiresAt, answersLeft, locationName, lat, lng, radius, taskActions, createLat, createLng} = req.body;

  if (!isNumeric(cost)) {
    return next(new Error("Cost must be a number in dollars."));
  }
  if (!isNumeric(lat) || !isNumeric(lng)) {
    return next(new Error("Lat and Lng must both be numbers."));
  }
  if (cost > req.user.balance) {
    return next(new Error("User does not have enough balance to create the task."));
  }

  db[CONSTANTS.MODELS.TASK].create({
    userId: req.user.id,
    name: taskName,
    cost: Number(parseFloat(cost).toFixed(2)), // truncate to cents
    refreshRate: refreshRate,
    expiresAt: expiresAt,
    answersLeft: answersLeft,
    createLat: Number(parseFloat(createLat).toFixed(6)),
    createLng: Number(parseFloat(createLng).toFixed(6)),
    activated: true,
    location: {
      name: locationName,
      lat: lat,
      lng: lng,
      radius: radius
    },
    taskactions: taskActions
  }, {
    include: [db[CONSTANTS.MODELS.TASK_ACTION], db[CONSTANTS.MODELS.LOCATION]]
  }).catch(error => {
    return next(error);
  }).then(createdTask => {
    createChangeLogPromise(createdTask.id, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_CREATED).then(() => {
      gcm.sendMessage({
        taskOwnerId: req.user.id,
        taskId: createdTask.id,
        taskName: createdTask.name,
        taskStatus: CONSTANTS.HELPERS.CHANGE_LOG_STATUS_CREATED
      }, null, (error) => {
        res.json({
          createdTaskId: createdTask.id,
          createdTaskActions: createdTask.taskactions
        });
      });
    }).catch(error => {
      return next(error);
    });

    // log task status when it expires
    setTimeout(() => {
      createChangeLogPromise(createdTask.id, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_COMPLETED);
    }, expiresAt - (new Date().getTime()));
  });
});


/**
 * GET: /db/task-delete/:task_id
 *
 * req: {
 *    
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
    include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_RESPONSE]]
  }).then(createChangeLogPromise(taskId, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_DELETED)).then( () => {
    res.redirect(CONSTANTS.ROUTES.INDEX);
  }).catch(error => {
    return next(error);
  });
});

/**
 * GET: /db/task-deactivate/:task_id
 *
 * req: {
 *    
 * }
 *
 * res: {
 *    //
 * }
 */
router.get(CONSTANTS.ROUTES.DB.TASK_DEACTIVATE + "/:taskId", (req, res, next) => {
  const taskId = req.params.taskId;
  debug(`Deactivating taskId=${taskId}`);
  
  db[CONSTANTS.MODELS.TASK].findOne({
    where: {
      id: taskId
    }
  }).then(task => {
    task.update({ activated: false });
    res.redirect(CONSTANTS.ROUTES.INDEX);
    createChangeLogPromise(taskId, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_COMPLETED);
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
router.post(CONSTANTS.ROUTES.DB.TASK_RESPOND, middlewares.ensureUserExists, middlewares.checkRequiredParams(["taskId", "responses", "taskActionIds"]), (req, res, next) => {
  const user = req.user;
  const taskId = req.body.taskId;
  const taskActionResponses = JSON.parse(req.body.responses); // JSONObj {taskActionId: response} as a string
  const taskActionIdArray = JSON.parse(req.body.taskActionIds);
  debug(`Responding to taskId=${taskId} by userId=${user.id}`);

  db[CONSTANTS.MODELS.TASK].findOne({
    where: {id: taskId},
    include: [db[CONSTANTS.MODELS.USER], {model: db[CONSTANTS.MODELS.TASK_RESPONSE], order: '"createdAt" DESC'}]
  }).then(task => {
    task.canAcceptNewResponses((error) => {
      if (error) return next(error);

      Promise.all([
        task.user.update({balance: task.user.balance - task.cost}),
        user.update({balance: user.balance + task.cost}),
        task.update({answersLeft: task.answersLeft - 1})
      ]).then(values => {
        db[CONSTANTS.MODELS.TASK_RESPONSE].create({
          userId: user.id,
          taskId: taskId
        }, {
          include: [db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]]
        }).catch(error => {
          return next(error);
        }).then((createdTaskResponse, err) => {
          db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE].bulkCreate(taskActionIdArray.map(id => {
            debug(`Setting response="${taskActionResponses[id]}" for taskActionId=${id}`);
            return {
              userId: user.id,
              response: taskActionResponses[id],
              taskactionId: id,
              taskresponseId: createdTaskResponse.id
            }
          })).then((newActions, err) => {
            const taskStatus = task.answersLeft === 0 ? CONSTANTS.HELPERS.CHANGE_LOG_STATUS_COMPLETED : CONSTANTS.HELPERS.CHANGE_LOG_STATUS_UPDATED;
            createChangeLogPromise(taskId, taskStatus).then(() => {
              gcm.sendMessage({
                taskOwnerId: task.user.id,
                taskId: task.id,
                taskName: task.name,
                taskStatus: CONSTANTS.HELPERS.CHANGE_LOG_STATUS_UPDATED
              }, null, (error) => {
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
router.get(CONSTANTS.ROUTES.DB.RESPONSE_FETCH, middlewares.checkRequiredParams(["taskId"]), (req, res, next) => {
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


// error handling middleware only for current route
router.use((err, req, res, next) => {
  debug(err);
  res.status(err.status || 500).json({error: err.message});
});

module.exports = app => {
  app.use("/", router);
};
