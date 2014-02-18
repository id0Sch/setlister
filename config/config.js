var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'setlist'
    },
    port: 3000,
    db: 'mongodb://localhost/setlist-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'setlist'
    },
    port: 3000,
    db: 'mongodb://localhost/setlist-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'setlist'
    },
    port: 3000,
    db: 'mongodb://localhost/setlist-production'
  }
};

module.exports = config[env];
