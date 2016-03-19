import express from "express";
import db from "../models";
import CONSTANTS, {ROUTES} from "../../config/constants";
import GCM from "../helpers/gcm";

const router = express.Router();
const gcm = new GCM();

/**
 * Checks if all required parameters have been provided when attempting to create a task.
 * TODO: perform better type and argument checking (whether in here or in model)
 *
 * @param body of the network request
 * @returns {boolean} true if all required parameters have been given
 */
function hasAllRequiredParameters(body) {
  const requiredParams = ["taskName", "cost", "expiresAt", "locationName", "lat", "lng", "radius", "taskActions"];
  for (let i = 0; i < requiredParams.length; i++) {
    if (!body[requiredParams[i]]) {
      return false;
    }
  }

  const requiredTaskActionParams = ["description", "type"];
  for (let i = 0; i < body.taskActions.length; i++) {
    for (let j = 0; j < requiredTaskActionParams.length; j++) {
      if (!body.taskActions[i][requiredTaskActionParams[j]]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Writes to the ChangeLog DB about what task had which status change.
 * The ChangeLog DB is later used when users try to sync with the server.
 *
 * @param taskId for task whose status is changing
 * @param status is one of CONSTANTS.HELPERS.CHANGE_LOG_STATUS_XXXXX
 * @returns {*|Object|Promise.<Instance>}
 */
function createChangeLogPromise(taskId, status) {
  return db[CONSTANTS.MODELS.CHANGE_LOG].create({
    taskId: taskId,
    status: status
  });
}

/**
 * Middleware for checking if userId was passed over.
 * Should be used for all POST routes.
 */
function checkIfUserIdProvided(req, res, next) {
  if (!req.body.userId) return res.json({error: "userId (email) not provided"});
  else next();
}

router.post(CONSTANTS.ROUTES.DB.TASK_ADD, checkIfUserIdProvided, (req, res, next) => {
  const userId = req.body.userId;
  if (!req.body['taskActions']) {
    return res.json({error: "Must provide at least one Action."});
  }
  if (!hasAllRequiredParameters(req.body)) {
    return res.json({error: "did not provide all required params"});
  }
  if (!parseFloat(req.body['cost'])) {
    return res.json({error: "Cost must be a number (in dollars)."});
  }
  if (!parseFloat(req.body['lat']) || !parseFloat(req.body['lng'])) {
    return res.json({error: "Lat and Lng must both be numbers."});
  }

  db[CONSTANTS.MODELS.TASK].create({
    userId: userId,
    name: req.body.taskName,
    cost: req.body.cost,
    expiresAt: req.body.expiresAt,
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
    console.log(error.message);
    return res.json({error: error.message});
  }).then(createdTask => {
    createChangeLogPromise(createdTask.id, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_CREATED).then(() => {
      gcm.sendMessage({name: createdTask.name}, (err, response) => {
        if (err) {
          console.log("failed to send gcm message");
        }
        return res.json({createdTaskId: createdTask.id});
      });
    }).catch(error => {
      console.log(error.message);
      return res.json({error: error.message});
    });
  });
});

router.get(CONSTANTS.ROUTES.DB.TASK_DELETE + "/:task_id", (req, res, next) => {
  const taskId = req.params.task_id;

  // TODO: also destroy corresponding locations, taskactions, and taskactionresponses
  db[CONSTANTS.MODELS.TASK].destroy({
    where: {
      id: taskId
    },
    include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_ACTION]]
  }).then(createChangeLogPromise(taskId, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_DELETED)).then(() => {
    res.redirect(CONSTANTS.ROUTES.INDEX);
  }).catch(error => {
    console.log(error.message);
    res.json({error: error.message});
  });
});


router.get(CONSTANTS.ROUTES.DB.TASK_FETCH, (req, res, next) => {
  let requestedFetchTaskIds;
  try {
    requestedFetchTaskIds = req.query.taskId ? JSON.parse(req.query.taskId) : [];
  } catch (error) {
    console.log(error.message);
    requestedFetchTaskIds = [];
  }

  db[CONSTANTS.MODELS.TASK].findAll({
    where: {
      id: requestedFetchTaskIds
    },
    include: [db[CONSTANTS.MODELS.LOCATION], {
      model: db[CONSTANTS.MODELS.TASK_ACTION],
      include: db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]
    }]
  }).then(fetchedTasks => {
    res.json(fetchedTasks);
  }).catch(error => {
    console.log(error.message);
    res.json({error: error.message});
  });
});

router.get(CONSTANTS.ROUTES.DB.TASK_SYNC, (req, res, next) => {
  db[CONSTANTS.MODELS.CHANGE_LOG].findAll({
    where: {
      createdAt: {gt: new Date(1 * req.query.lastUpdated)}
    }
  }).then(allChanges => {
    if (allChanges.length > 0) {
      const changeLog = {
        lastUpdated: allChanges[allChanges.length - 1].createdAt.getTime(),
        changes: allChanges.map(changeObj => {
          return {taskId: changeObj.taskId, status: changeObj.status};
        })
      };
      res.json(changeLog);
    }
    else {
      res.json({
        lastUpdated: 0,
        changes: []
      });
    }
  }).catch(error => {
    console.log(error.message);
    res.json({error: error.message});
  });
});

router.post(CONSTANTS.ROUTES.DB.TASK_RESPOND, checkIfUserIdProvided, (req, res, next) => {
  const userId = req.body.userId;
  const taskActionIds = [];
  for (let key in req.body) {
    if (key.indexOf("userId") < 0) {
      taskActionIds.push(key);
    }
  }

  Promise.all([db[CONSTANTS.MODELS.USER].findOne({
    where: {id: userId}
  }), db[CONSTANTS.MODELS.TASK_ACTION].findAll({
    where: {id: taskActionIds}
  })]).then(args => {
    const user = args[0];
    const taskActions = args[1];

    if (!user) {
      console.log("provided user does not exist");
      res.json({error: "provided user does not exist"});
    }

    db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE].bulkCreate(taskActions.map(obj => {
      return {userId: user.id, taskactionId: obj.id, response: req.body[obj.id]}
    })).then(() => {
      res.json({error: "", result: true})
    }).catch(error => {
      console.log(error.message);
      res.json({error: error.message});
    });
  });
});

router.post(CONSTANTS.ROUTES.DB.USER_CREATE, checkIfUserIdProvided, (req, res, next) => {
  const userId = req.body.userId;
  const gcmToken = req.body.gcmToken;

  db[CONSTANTS.MODELS.USER].findOrCreate({
    where: {id: userId}
  }).catch(error => {
    console.log(error.message);
    res.json({error: error.message});
  }).then(userCreateResult => {
    if (gcmToken) {
      userCreateResult[0].update({gcmToken: gcmToken})
    }
    res.json({error: "", result: userCreateResult[1]});
  });
});

export default function (app) {
  app.use("/", router);
};
