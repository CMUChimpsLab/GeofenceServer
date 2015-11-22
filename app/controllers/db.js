import express from "express";
import db from "../models";
import CONSTANTS, {ROUTES} from "../../config/constants";
import GCM from "../helpers/gcm";
import uid from "uid"

const router = express.Router();
const gcm = new GCM();

router.post(CONSTANTS.ROUTES.LOCATION_ADD, (req, res, next) => {
  const locationObj = {
    uid : uid(16),
    question: req.body.question,
    name: req.body.name,
    lat: req.body.lat,
    lng: req.body.lng,
    radius: req.body.radius
  };

  gcm.sendMessage(locationObj, (err) => {
    if(err) {
      console.log("failed to send gcm message");
    }
    else {
      db[CONSTANTS.MODELS.LOCATION].create(locationObj).then(() => {
        res.redirect(CONSTANTS.ROUTES.INDEX);
      });
    }
  });
});


router.get(CONSTANTS.ROUTES.LOCATION_DELETE+"/:location_id", (req, res, next) => {
  db[CONSTANTS.MODELS.LOCATION].destroy({
    where: {
      id: req.params.location_id
    }
  }).then(function() {
    res.redirect(CONSTANTS.ROUTES.INDEX);
  });
});

export default function(app) {
  app.use('/db', router);
}
