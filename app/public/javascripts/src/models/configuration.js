app.service('configuration', ($location, $http, $rootScope) => {

    var config = {}
    var configBaseUrl = 'http://' + $location.host() + ':' + $location.port()
    var configurationPromises = []  // Configuration is said to be "loaded" when all promises are resolved

    // Get locations layer configuration
    configurationPromises.push(
      new Promise((resolve, reject) => {
        $http.get(configBaseUrl + '/uiConfiguration/locations_layer')
          .success((response) => {
            config.locations_layer = response
            resolve()
          })
          .error(reject)
      })
    )

    // When all promises are resolved, raise an event. This is to account for latency issues with the server.
    Promise.all(configurationPromises)
      .then(() => {
        // All promises resovled successfully
        $rootScope.$broadcast('configuration_loaded')
      })
      .catch((reason) => console.log('Promise.all() failed, ' + reason))

    return config
})
