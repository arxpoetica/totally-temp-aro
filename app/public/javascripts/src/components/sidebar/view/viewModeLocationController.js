class ViewModeLocationController {

  constructor($http, $timeout, state, configuration) {
    this.state = state
    this.plan = null
    this.selectedLocationInfo = null
    this.map_url = null
    this.currentUser = state.getUser()

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })

    state.mapFeaturesSelectedEvent.subscribe((options) => {
      var locationsList = []
      if (options.hasOwnProperty('locations')) locationsList = options.locations
      
      var locationId = null
      // Update state's selected location list 
      if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
        
        var selectedViewFeaturesByType = state.selectedViewFeaturesByType.getValue()
        selectedViewFeaturesByType.location = {}
        locationsList.forEach((feature) => {
          var id = null
          if ( feature.hasOwnProperty('id') ){
            id = feature.id
          }else if ( feature.hasOwnProperty('location_id') ){
            id = feature.location_id
          }
          
          if (null != id) selectedViewFeaturesByType.location[ id ] = feature
        })
        state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
        
        state.activeViewModePanel = state.viewModePanels.LOCATION_INFO
        //$timeout()
        locationId = options.locations[0].location_id;

        getLocationInfo(this.plan.id,locationId)
        .then((locationInfo) => {
          this.selectedLocationInfo = locationInfo
          this.showAttributes = this.currentUser.rol === 'sales' && !angular.equals(locationInfo.attributes, {})
          
          var google_maps_key = configuration.google_maps_key
          var coordinates = locationInfo.geog.coordinates[1] + ',' + locationInfo.geog.coordinates[0]
          var params = {
            center: coordinates,
            zoom: 13,
            size: '325x110',
            scale: 2,
            maptype: 'roadmap',
            markers: 'color:red|label:L|' + coordinates,
            key: google_maps_key
          }
          this.map_url = 'https://maps.googleapis.com/maps/api/staticmap?' +
            _.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&')
        })
      } else {
        this.selectedLocationInfo = null
      }
    })

    // Get the location Information
    function getLocationInfo(planId, id, callback) {
      return $http.get('/locations/' + planId + '/' + id + '/show')
        .then((response) => {
          return response.data
        })
    }

    this.showDetailLocationInfo = () => {
      this.selectedLocationInfo.id = +this.selectedLocationInfo.location_id      
      state.showDetailedLocationInfo.next(this.selectedLocationInfo)
    }

    state.clearViewMode.subscribe((clear) => {
      if(clear) this.selectedLocationInfo = null
    })
  }  
}

ViewModeLocationController.$inject = ['$http','$timeout','state','configuration']

export default ViewModeLocationController