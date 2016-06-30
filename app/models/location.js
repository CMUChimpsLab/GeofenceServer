const CONSTANTS = require("../../config/constants");

module.exports = function (sequelize, DataType) {
  const Location = sequelize.define(CONSTANTS.MODELS.LOCATION, {
    name: {type: DataType.STRING, allowNull: false},
    lat: {type: DataType.DOUBLE, allowNull: false},
    lng: {type: DataType.DOUBLE, allowNull: false},
    radius: {type: DataType.DOUBLE, allowNull: false}
  }, {
    classMethods: {
      associate: function (models) {
        Location.belongsTo(models[CONSTANTS.MODELS.TASK], {
          onDelete: "CASCADE",
          foreignKey: {allowNull: false}
        });
      }
    }
  });

  return Location;
};
