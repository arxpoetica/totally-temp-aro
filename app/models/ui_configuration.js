// UI Configuration
//
// Configuration parameters used to customize the UI for different clients
'use strict'

var fs = require('fs')

module.exports = class UIConfiguration {

  // Configuration sets are read from disk as required, and are dependent upon the ARO_CLIENT
  // environment variable. We save them after reading so the next request does not reload from disk.
  constructor() {
    this.configurations = {}
  }

  // Returns the specified configuration set
  getConfigurationSet (configSet) {
    
    if (!this.configurations[configSet]) {
      // This configuration set has not been loaded. Load it from disk now.
      // Do the config merege here
    	  var clientConfigFile = '../../conf/' + process.env.ARO_CLIENT + '/' + configSet + '.json'
      this.configurations[configSet] = require(clientConfigFile)
    }

    return this.configurations[configSet]
  }
}