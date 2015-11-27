import express from "express";
import db from "../models";
import CONSTANTS, {ROUTES} from "../../config/constants";
import GCM from "../helpers/gcm";

const router = express.Router();
const gcm = new GCM();

// TODO: perform type checking (whether in here or in model)
function hasAllRequiredParameters(body) {
  const requiredParams = ["taskName", "cost", "locationName", "lat", "lng", "radius", "taskActions"];
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

function createChangeLogPromise(taskId, status) {
  return db[CONSTANTS.MODELS.CHANGE_LOG].create({
    taskId: taskId,
    status: status
  });
}

router.post(CONSTANTS.ROUTES.DB.TASK_ADD, (req, res, next) => {
  if (!hasAllRequiredParameters(req.body)) {
    return res.json({error: "did not provide all required params"});
  }

  const taskObj = {
    name: req.body.taskName,
    cost: req.body.cost
  };

  const locationObj = {
    name: req.body.locationName,
    lat: req.body.lat,
    lng: req.body.lng,
    radius: req.body.radius
  };

  const taskActionObjs = [];
  req.body.taskActions.forEach(taskAction => {
    taskActionObjs.push({
      description: taskAction.description,
      type: taskAction.type
    });
  });

  // create task
  db[CONSTANTS.MODELS.TASK].create(taskObj).then(task => {
      // create taskactions promises
      const dbPromises = taskActionObjs.map(taskActionObj => {
        taskActionObj[CONSTANTS.MODELS.TASK + CONSTANTS.HELPERS.SUFFIX_ID_FIELD] = task.id;
        return db[CONSTANTS.MODELS.TASK_ACTION].create(taskActionObj);
      });

      // create location promise
      locationObj[CONSTANTS.MODELS.TASK + CONSTANTS.HELPERS.SUFFIX_ID_FIELD] = task.id;
      dbPromises.push(db[CONSTANTS.MODELS.LOCATION].create(locationObj));

      // add change log promise
      dbPromises.push(createChangeLogPromise(task.id, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_CREATED));

      Promise.all(dbPromises).then(() => {
          db[CONSTANTS.MODELS.TASK].findOne({
            where: {
              id: task.id
            },
            include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_ACTION]]
          }).then(createdTask => {
              //gcm.sendMessage(taskObj, (err) => {
              //  if (err) {
              //    console.log("failed to send gcm message");
              //  }
              //  res.redirect(CONSTANTS.ROUTES.INDEX);
              //});
              res.redirect(CONSTANTS.ROUTES.INDEX); //res.json(createdTask);
            })
            .catch(error => {
              console.log(error.message);
              res.json({error: error.message});
            });
        })
        .catch(error => {
          console.log(error.message);
          res.json({error: error.message});
        });
    })
    .catch(error => {
      console.log(error.message);
      res.json({error: error.message});
    });
});

router.get(CONSTANTS.ROUTES.DB.TASK_DELETE + "/:task_id", (req, res, next) => {
  const taskId = req.params.task_id;

  // TODO: need to check if taskactions and locations get deleted too
  db[CONSTANTS.MODELS.TASK].destroy({
    where: {
      id: taskId
    },
    include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_ACTION]]
  }).then(createChangeLogPromise(taskId, CONSTANTS.HELPERS.CHANGE_LOG_STATUS_DELETED)).then(function () {
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
    include: [db[CONSTANTS.MODELS.LOCATION], db[CONSTANTS.MODELS.TASK_ACTION]]
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

router.post(CONSTANTS.ROUTES.DB.TASK_RESPOND, (req, res, next) => {
  const taskId = req.body.taskId;
  const taskActions = [];
  for (let key in req.body) {
    if (key.indexOf("taskId") < 0) {
      taskActions.push({taskActionId: key, response: req.body[key]});
    }
  }
  ;

  res.json({taskSubmission: "success"});
});

export default function (app) {
  app.use("/", router);
};
