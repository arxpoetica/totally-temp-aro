app.service('configuration',['$location', '$http', '$rootScope', ($location, $http, $rootScope) => {

    var config = {}
    var configBaseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port()
    var configurationPromises = []  // Configuration is said to be "loaded" when all promises are resolved
    config.google_maps_key = 'AIzaSyDYjYSshVYlkt2hxjrpqTg31KdMkw-TXSM' 

    // Define a list of configurations we want to get from the server
    var configurationTypes = [
      'locationCategories',
      'networkEquipment',
      'units',
      'aroClient',
      'mapType',
      'locationDetailProperties',
      'uiVisibility'
    ]

    configurationTypes.forEach((configurationType) => {
      configurationPromises.push(
        new Promise((resolve, reject) => {
          $http.get(`${configBaseUrl}/uiConfiguration/${configurationType}`)
            .then((response) => {
              if (response.status >= 200 && response.status <= 299) {
                config[configurationType] = response.data
                resolve()
              } else {
                reject()
              }
            })
        })
      )
    })

    // When all promises are resolved, raise an event. This is to account for latency issues with the server.
    Promise.all(configurationPromises)
      .then(() => {
        // All promises resovled successfully
        $rootScope.$broadcast('configuration_loaded')
      })
      .catch((reason) => console.log('Promise.all() failed, ' + reason))

    // Our configuration object will have a "perspective" property. This decides what the logged in user can see
    // in the UI (i.e. the users perspective). Start with a default, and allow it to be changed when the logged in user changes.

    var getPerspectiveByKey = (key)=> {
      return config.uiVisibility.filter((c)=>{
        return c.name === key
      })[0]
    }

    config.loadPerspective = (userPerspective) => {
      switch (userPerspective) {
        case 'admin':
        default:
          config.perspective = getPerspectiveByKey('default')
        break

        case 'sales_engineer':
          config.perspective = getPerspectiveByKey('sales_engineer')
        break

        case 'account_exec':
          config.perspective = getPerspectiveByKey('account_exec')
        break
      }
    }

    return config
}])
