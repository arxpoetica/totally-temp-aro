app.service('configuration',['$location', '$http', '$rootScope', ($location, $http, $rootScope) => {

    var config = {}
    var configBaseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port()
    var configurationPromises = []  // Configuration is said to be "loaded" when all promises are resolved

    // Define a list of configurations we want to get from the server
    var configurationTypes = [
      'locationCategories',
      'networkEquipment'
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

    return config
}])
