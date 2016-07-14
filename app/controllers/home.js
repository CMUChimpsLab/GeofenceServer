const express = require("express");
const db = require("../models");
const CONSTANTS = require("../../config/constants");
const router = express.Router();
const fs = require("fs");
const tsv = require("tsv");
const sequelize = require("sequelize");

// generate costdata.tsv and latlngdata.tsv
// based on all the tasks
function generateData(tasks) {
  // costdata.tsv
  db[CONSTANTS.MODELS.TASK].findAll({
    attributes: ['cost', [sequelize.fn('COUNT', 'id'), 'CostCount']],
    group: ['cost']
  }).then(tasks => {
    var costdata = [];
    for (let i = 0; i < 20; i++) {
      costdata.push({
        cost: i / 2,
        num: 0
      });
    }
    for (let i = 0; i < tasks.length; i++) {
      costdata.push({
        cost: tasks[i].dataValues.cost,
        num: tasks[i].dataValues.CostCount
      });
    }

    fs.writeFile(__dirname + "/../../data/costdata.tsv", tsv.stringify(costdata), err => {
      if (err)
        console.log(err);
    });
  }).catch(error => {
    console.log(error);
  });

  // latlngdata.tsv, timedata.tsv
  // this is not async
  var latlngdata = [];
  var timedata = [];
  console.log(tasks[0]);
  tasks.map(task => {
    latlngdata.push({
      lat: task.location.lat,
      lng: task.location.lng,
      name: task.name,
      cost: task.cost
    });
    timedata.push({ createdAt: task.createdAt });

  });
  fs.writeFile(__dirname + "/../../data/latlngdata.tsv", tsv.stringify(latlngdata), err => {
    if (err)
      console.log(err);
  });
  fs.writeFile(__dirname + "/../../data/timedata.tsv", tsv.stringify(timedata), err => {
    if (err)
      console.log(err);
  });
}

/***
 * Homepage
 */
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

/***
 * Visualising usage data
 */
router.get(CONSTANTS.ROUTES.REPORT, (req, res, next) => {
  db[CONSTANTS.MODELS.TASK].findAll({
    include: [
      db[CONSTANTS.MODELS.LOCATION],
      db[CONSTANTS.MODELS.USER]
    ]
  }).then(tasks => {
    allTasks = tasks;

    // generate tsv data
    generateData(allTasks);

    // then find all the users
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
        users: users,
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

// usage data section
router.get("/costdata.tsv", (req, res, next) => {
  var file = __dirname + '/../../data/costdata.tsv';
  res.download(file);
});

router.get("/latlngdata.tsv", (req, res, next) => {
  var file = __dirname + '/../../data/latlngdata.tsv';
  res.download(file);
});

router.get("/timedata.tsv", (req, res, next) => {
  var file = __dirname + '/../../data/timedata.tsv';
  res.download(file);
});

module.exports = app => {
  app.use("/", router);
};
