const express = require("express");
const config = require("./config/config");
const db = require("./app/models");
const setup = require("./config/express");

process.env.TZ = 'America/New_York';

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

module.exports = app;
