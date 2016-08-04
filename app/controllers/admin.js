const express = require("express");
const db = require("../models");
const CONSTANTS = require("../../config/constants");
const router = express.Router();
const fs = require("fs");
const tsv = require("tsv");
const Sequelize = require("sequelize");

/***
 * generate costdata.tsv and latlngdata.tsv
 * based on all the tasks
 */
function generateData(tasks) {
  // costdata.tsv
  db[CONSTANTS.MODELS.TASK].findAll({
    attributes: ['cost', [Sequelize.fn('COUNT', 'id'), 'CostCount']],
    group: ['cost']
  }).then(tasks => {
    var costdata = [];
    for (let i = 0; i <= 10; i+=0.5) {
      costdata.push({
        cost: i,
        num: 0
      });
    }
    for (let i = 0; i < tasks.length; i++) {
      costdata.push({
        cost: tasks[i].dataValues.cost,
        num: tasks[i].dataValues.CostCount
      });
    }

    costdata.sort(function(a, b) {
      return a.cost - b.cost;
    });

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
 * Visualising usage data
 */
router.get(CONSTANTS.ROUTES.ADMIN.REPORT, (req, res, next) => {
  db[CONSTANTS.MODELS.TASK].findAll({
    include: [
      db[CONSTANTS.MODELS.LOCATION],
      db[CONSTANTS.MODELS.USER]
    ]
  }).then(tasks => {
    var allTasks = tasks;

    // generate tsv data
    generateData(allTasks);

    // then find all the users
    db[CONSTANTS.MODELS.USER].findAll({
      include: [
        db[CONSTANTS.MODELS.TASK],
        db[CONSTANTS.MODELS.TASK_RESPONSE]
      ]
    }).then(users => {
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

/***
 * Pulling user data
 */
router.get(CONSTANTS.ROUTES.ADMIN.USERS, (req, res, next) => {
  db[CONSTANTS.MODELS.USER].findAll({
    include: [
      db[CONSTANTS.MODELS.TASK_RESPONSE],
      db[CONSTANTS.MODELS.TASK]
    ]
  }).then(users => {
    var now = new Date().getTime();
    for (let i = 0; i < users.length; i++) {
      var updated = Date.parse(users[i].updatedAt);
      users[i]["dormantHours"] = parseFloat((now - updated) / 36e5).toFixed(1);
  }

    res.render(CONSTANTS.VIEWS.USERS, {
      title: "Crowdsourcing User Report",
      routes: CONSTANTS.ROUTES,
      users: users
    });
  }).catch(error => {
    next(error);
  });
});

// usage data section
router.get("/admin/costdata.tsv", (req, res, next) => {
  var file = __dirname + '/../../data/costdata.tsv';
  res.download(file);
});

router.get("/admin/latlngdata.tsv", (req, res, next) => {
  var file = __dirname + '/../../data/latlngdata.tsv';
  res.download(file);
});

router.get("/admin/timedata.tsv", (req, res, next) => {
  var file = __dirname + '/../../data/timedata.tsv';
  res.download(file);
});

module.exports = app => {
    app.use("/", router);
}