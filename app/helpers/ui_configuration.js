// UI Configuration
//
// Configuration parameters used to customize the UI for different clients
'use strict'

var helpers = require('../helpers')
var database = helpers.database

module.exports = class UIConfiguration {

  // Configuration sets are read from disk as required, and are dependent upon the ARO_CLIENT
  // environment variable. We save them after reading so the next request does not reload from disk.
  constructor () {
    this.clearCache()
  }

  // Loads the specified JSON file if it exists. If not, returns defaultValue
  loadJSONFile (fileWithPath, defaultValue) {
    var jsonContents = null
    try {
      jsonContents = require(fileWithPath)
    } catch (err) {
      console.warn(`File ${fileWithPath} could not be located in ui_configuration.js. Will use default settings.`)
      jsonContents = defaultValue
    }
    return jsonContents
  }

  // Returns the specified configuration set
  getConfigurationSetFromFile (configSet) {
    var baseConfigPath = `../../conf/base/${configSet}.json`
    var clientConfigPath = `../../conf/${process.env.ARO_CLIENT}/${configSet}.json`

    var baseConfig = this.loadJSONFile(baseConfigPath, null) // easier than testing for {}
    var clientConfig = this.loadJSONFile(clientConfigPath, {})

    if (!baseConfig) {
      // if we're just going to copy everything to an empty object, no need to do it one at a time
      baseConfig = clientConfig
    } else {
      UIConfiguration.basicDeepObjMerge(baseConfig, clientConfig)
    }
    return Promise.resolve(baseConfig)
  }

  getConfigurationSetFromDatabase (configSet) {
    const sql = 'SELECT settings FROM ui.settings WHERE type=$1 AND client=$2'
    return Promise.all([
      database.query(sql, [configSet, 'base']),
      database.query(sql, [configSet, process.env.ARO_CLIENT])
    ])
      .then(results => {
        // We should always have a baseConfig for all configSets
        const baseConfig = (results[0][0] && results[0][0].settings) || {}
        // We may not have a client config for all clients
        const clientConfig = (results[1][0] && results[1][0].settings) || {}
        UIConfiguration.basicDeepObjMerge(baseConfig, clientConfig)
        return Promise.resolve(baseConfig)
      })
      .catch(err => console.error(err))
  }

  getEnumStrings () {
    const sql = `
      SELECT p.name as package, c.name as class, es.key, es.description
      FROM ui.enum_string es
      JOIN ui.package p
        ON p.id=es.package_id
      JOIN ui.class c
        ON c.id=es.class_id
      WHERE client_id=(SELECT id FROM ui.client WHERE name=$1)
        AND locale_id=(SELECT id FROM ui.locale WHERE locale='en-US');
    `
    return Promise.all([
      database.query(sql, ['base']),
      database.query(sql, [process.env.ARO_CLIENT])
    ])
      .then(results => {
        // Create a UI strings object keyed by module name
        const baseStringDefinitions = results[0]
        const clientStringDefinitions = results[1]
        var enumStrings = {}
        // First populate the base definitions
        baseStringDefinitions.forEach(baseDef => {
          enumStrings[baseDef.package] = enumStrings[baseDef.package] || {}
          enumStrings[baseDef.package][baseDef.class] = enumStrings[baseDef.package][baseDef.class] || {}
          enumStrings[baseDef.package][baseDef.class][baseDef.key] = baseDef.description
        })
        // Then override with the client definitions. The client does not need to define all strings.
        clientStringDefinitions.forEach(clientDef => {
          if (enumStrings[clientDef.package] &&
            enumStrings[clientDef.package][clientDef.class] &&
            enumStrings[clientDef.package][clientDef.class][clientDef.key]) {
            enumStrings[clientDef.package][clientDef.class][clientDef.key] = clientDef.description
          } else {
            //throw new Error('A client string definition was encountered, but there is no corresponding base definition. Always define the base definition')
          }
        })
        console.log('Enum Strings loaded from database')
        return Promise.resolve(enumStrings)
      })
      .catch(err => console.error(err))
  }

  getConfigurationSet (configSet) {
    if (!this.configurations[configSet]) {
      // This configuration set has not been loaded yet. Load it.
      const dbConfigSets = [
        'boundaryCategories',
        'locationCategories',
        'copperCategories',
        'constructionAreas',
        'networkEquipment',
        'plan',
        'perspectives',
        'toolbar',
        'showPlanDataSelection',
        'broadcast',
        'userGroups'
      ]
      if (dbConfigSets.indexOf(configSet) >= 0) {
        // These configuration settings are stored in the database
        this.configurations[configSet] = this.getConfigurationSetFromDatabase(configSet)
      } else {
        // These configuration settings are stored in the filesystem
        this.configurations[configSet] = this.getConfigurationSetFromFile(configSet)
      }
    }
    return this.configurations[configSet]
  }

  clearCache () {
    this.configurations = {}
  }

  static basicDeepObjMerge (baseObj, maskObj) {
    // will merge maskObj on to baseObj, in place
    for (var key in maskObj) {
      if (maskObj.hasOwnProperty(key)) {
        if ((typeof maskObj[key] === 'object') && (typeof baseObj[key] === 'object')) {
          UIConfiguration.basicDeepObjMerge(baseObj[key], maskObj[key])
        } else {
          baseObj[key] = maskObj[key]
        }
      }
    }
  }
}
