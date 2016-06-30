const path = require("path");

const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'server'
    },
    port: 3000,
    db: 'sqlite://localhost/db-development',
    storage: rootPath + '/data/db-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'server'
    },
    port: 3000,
    db: 'sqlite://localhost/db-test',
    storage: rootPath + '/data/db-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'server'
    },
    port: 3000,
    db: 'sqlite://localhost/db-production',
    storage: rootPath + 'data/db-production'
  }
};

module.exports = config[env];
