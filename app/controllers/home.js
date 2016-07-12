const express = require("express");
const db = require("../models");
const CONSTANTS = require("../../config/constants");
const router = express.Router();

router.get(CONSTANTS.ROUTES.INDEX, (req, res, next) => {
  db[CONSTANTS.MODELS.TASK].findAll({
    include: [db[CONSTANTS.MODELS.LOCATION], {
      model: db[CONSTANTS.MODELS.TASK_ACTION],
      include: db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE]
    }]
  }).then(tasks => {
    res.render(CONSTANTS.VIEWS.INDEX, {
      title: 'CrowdsourcingServer - Main',
      routes: CONSTANTS.ROUTES,
      tasks: tasks
    });
  }).catch(error => {
    next(error);
  });
});

// visualise
router.get(CONSTANTS.ROUTES.REPORT, (req, res, next) => {
  db[CONSTANTS.MODELS.TASK].findAll({
    include: [
      db[CONSTANTS.MODELS.LOCATION],
      db[CONSTANTS.MODELS.USER]
    ]
  }).then(tasks => {
    allTasks = tasks;
    db[CONSTANTS.MODELS.USER].findAll({
      include: [
        db[CONSTANTS.MODELS.TASK],
        db[CONSTANTS.MODELS.TASK_RESPONSE]
      ]
    }).then(users => {
      allUsers = users;
      res.render(CONSTANTS.VIEWS.REPORT, {
        title: "Crowdsourcing Usage Report",
        routes: CONSTANTS.ROUTES,
        tasks: tasks,
        users: users
      });
    })
  }).catch(error => {
      next(error);
  });
});


router.get(CONSTANTS.ROUTES.APK, (req, res, next) => {
  var file = __dirname + '/../../public/apk/citysourcing.apk';
  res.download(file);
});

module.exports = app => {
  app.use("/", router);
};
