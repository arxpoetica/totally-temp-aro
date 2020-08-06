// See https://github.com/angular/protractor/blob/master/docs/referenceConf.js

var app;

exports.config = {
  // seleniumAddress: 'http://localhost:4444/wd/hub',
  directConnect: true,
  specs: ['*-spec.js'],
  capabilities: {
    browserName: 'chrome',
    
  },
  framework: 'mocha',
  beforeLaunch: function() {
    app = require('../../app');
    app.listen(process.env.PORT || 8000);

    var q = require('q');
    var deferred = q.defer();
    var test_utils = require('../models/test_utils');
    test_utils.createTestUser(function(err, user) {
      if (err) return deferred.reject(err);
      return deferred.resolve();
    });
    return deferred.promise;
  },
  afterLaunch: function() {

  },
  mochaOpts: {
    ui: 'bdd',
    reporter: 'spec',
    timeout: 30000,
  },
};
