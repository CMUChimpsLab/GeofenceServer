import express from "express";
import db from "../models";
import CONSTANTS, {ROUTES} from "../../config/constants";

const router = express.Router();

router.get(CONSTANTS.ROUTES.INDEX, (req, res, next) => {
  db[CONSTANTS.MODELS.LOCATION].findAll().then(locations => {
    res.render(CONSTANTS.VIEWS.INDEX, {
      title: 'CrowdsourcingServer - Main',
      routes: ROUTES,
      locations: locations
    });
  });
});

router.get(CONSTANTS.ROUTES.LOCATION_ADD, (req, res, next) => {
  res.render(CONSTANTS.VIEWS.LOCATION_ADD, {
    title: 'CrowdsourcingServer - Add Location',
    routes: ROUTES
  });
});

export default function(app) {
  app.use('/', router);
}
