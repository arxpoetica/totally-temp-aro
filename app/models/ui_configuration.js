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

  // Loads the specified JSON file if it exists. If not, returns defaultValue
  loadJSONFile(fileWithPath, defaultValue) {
    var jsonContents = null
    try {
      jsonContents = require(fileWithPath)
    } catch(err) {
      console.warn(`File ${fileWithPath} could not be located in ui_configuration.js`)
      console.warn(err)
      jsonContents = defaultValue
    }
    return jsonContents
  }

  // Returns the specified configuration set
  getConfigurationSet (configSet) {
    
    if (!this.configurations[configSet]) {
      // This configuration set has not been loaded. Load it from disk now.
      // merge base config with client config 
      var baseConfigPath = `../../conf/base/${configSet}.json`
      var clientConfigPath = `../../conf/${process.env.ARO_CLIENT}/${configSet}.json`
      
      var baseConfig = this.loadJSONFile(baseConfigPath, null) // easier than testing for {}
      var clientConfig = this.loadJSONFile(clientConfigPath, {})

      if (null == baseConfig){
        // if we're just going to copy everything, no need to do it one at a time
        baseConfig = clientConfig 
      }else{
        UIConfiguration.basicDeepObjMerge(baseConfig, clientConfig)
      }
      this.configurations[configSet] = baseConfig
    }

    return this.configurations[configSet]
  }
  
  
  static basicDeepObjMerge(baseObj, maskObj){
    // will merge maskObj on to baseObj, in place
    for (var key in maskObj){
      if (maskObj.hasOwnProperty(key)){
        if ('object' == typeof maskObj[key] && 'object' == typeof baseObj[key]){
          UIConfiguration.basicDeepObjMerge(baseObj[key], maskObj[key])
        }else{
          baseObj[key] = maskObj[key]
        }
      } 
    }     
  }
  
}