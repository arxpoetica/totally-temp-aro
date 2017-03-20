app.service('configuration', ($location, $http) => {

    var config = {}
    var configBaseUrl = 'http://' + $location.host() + ':' + $location.port()
    // Get locations layer configuration
    console.log(configBaseUrl + '/uiConfiguration/locations_layer')
    $http.get(configBaseUrl + '/uiConfiguration/locations_layer')
        .success((response) => {
          console.log(response)
          config.locations_layer = response
        })

    return config
})
