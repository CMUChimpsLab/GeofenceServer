import express from "express";
import db from "../models";
import CONSTANTS, {ROUTES} from "../../config/constants";

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
      routes: ROUTES,
      tasks: tasks
    });
  }).catch(error => {
    console.log(error.message);
    res.json({error: error.message});
  });
});

router.get(CONSTANTS.ROUTES.TASK_ADD, (req, res, next) => {
  res.render(CONSTANTS.VIEWS.TASK_ADD, {
    title: 'CrowdsourcingServer - Add Task',
    routes: ROUTES
  });
});

export default function (app) {
  app.use("/", router);
}
