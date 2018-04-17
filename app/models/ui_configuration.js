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
        if(configSet === 'aroClient')
            this.configurations['aroClient'] = process.env.ARO_CLIENT || ''
            return this.configurations['aroClient']

        // This configuration set has not been loaded. Load it from disk now.
      
      // merge base config with client config 
      var baseConfigPath = '/srv/www/aro/conf/base/' + configSet + '.json'
      var clientConfigPath = '/srv/www/aro/conf/' + process.env.ARO_CLIENT + '/' + configSet + '.json'
      
      var baseConfigFile = null
      var clientConfigFile = null
      var outputConfigFile = null
      
      if (fs.existsSync(baseConfigPath)){
        baseConfigFile = JSON.parse( fs.readFileSync(baseConfigPath) )
      }
      
      if (fs.existsSync(clientConfigPath)){
        clientConfigFile = JSON.parse( fs.readFileSync(clientConfigPath) )
      }
      
      if (null != baseConfigFile && null == clientConfigFile){
        outputConfigFile = baseConfigFile
      }else if(null == baseConfigFile && null != clientConfigFile){
        outputConfigFile = clientConfigFile
      }else if(null != baseConfigFile && null != clientConfigFile){
        UIConfiguration.basicDeepObjMerge(baseConfigFile, clientConfigFile)
        outputConfigFile = baseConfigFile
      }

      this.configurations[configSet] = outputConfigFile
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