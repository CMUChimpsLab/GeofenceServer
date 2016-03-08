import express from "express";
import config from "./config/config";
import db from "./app/models";
import setup from './config/express';

const app = express();
setup(app, config);

db.sequelize
  .sync()
  .then(() => {
    app.listen(config.port, () => {
      console.log('Express server listening on port ' + config.port);
    });
  }).catch(e => {
    throw new Error(e);
  });

export default app;
