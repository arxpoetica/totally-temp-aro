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
  },
  afterLaunch: function() {

  },
  mochaOpts: {
    ui: 'bdd',
    reporter: 'spec',
    timeout: 30000,
  },
};
