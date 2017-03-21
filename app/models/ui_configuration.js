// UI Configuration
//
// Configuration parameters used to customize the UI for different clients
'use strict'

var fs = require('fs')
var merge = require('deepmerge')  // Used to deep-merge two javascript objects
var aro_client = process.env.ARO_CLIENT || ''

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
      // First load the "default" configuration set that will be the parent set.
      var defaultConfigSet = require('../../conf/default/' + configSet + '.json')
      // Then load the configuration set for the specific ARO_CLIENT
      var clientConfigSet = require('../../conf/' + aro_client + '/' + configSet + '.json')

      // Inherit from defaultConfigSet, then overwrite any values present in clientConfigSet
      this.configurations[configSet] = merge(defaultConfigSet, clientConfigSet)
    }

    return this.configurations[configSet]
  }
}