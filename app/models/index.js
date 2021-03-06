const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../../config/config");

const db = {};
const sequelize = new Sequelize(config.db, {
  storage: config.storage,
  logging: function() {} // Stop logging, it's a pain to read through.
});

if (!fs.existsSync(config.root + "/data")) {
  fs.mkdir(config.root + "/data", error => {
    if (error)
      console.log(error);
  });
}

fs.readdirSync(__dirname).filter(file => {
  return (file.indexOf('.') !== 0) && (file !== 'index.js');
}).forEach(file => {
  const model = sequelize['import'](path.join(__dirname, file));
  db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
