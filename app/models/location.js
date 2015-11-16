import CONSTANTS from "../../config/constants";

// http://sequelize.readthedocs.org/en/1.7.0/docs/models/

export default function (sequelize, DataType) {
  return sequelize.define(CONSTANTS.MODELS.LOCATION, {
    name: {type: DataType.TEXT, allowNull: false},
    lat: {type: DataType.STRING, allowNull: false},
    lng: {type: DataType.STRING, allowNull: false},
    radius: {type: DataType.STRING, allowNull: false},
    expiresAt: {type: DataType.DATE, defaultValue: DataType.NOW}
  }, {
    classMethods: {
      associate: function (models) {
        // example on how to add relations
        // Article.hasMany(models.Comments);
      }
    }
  });
};
