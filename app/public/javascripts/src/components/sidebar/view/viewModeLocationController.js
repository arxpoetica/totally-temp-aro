class ViewModeLocationController {

  constructor($http,state,configuration) {
    this.$http = $http
    this.state = state
    this.configuration = configuration
    this.plan = null
    this.selectedLocationInfo = null
    this.map_url = null
    this.currentUser = state.getUser()
    this.selectedLocation = null

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })

    state.mapFeaturesSelectedEvent
    .subscribe((options) => {
      var locationId = null
      if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
        locationId = options.locations[0].location_id;

        this.getLocationInfo(this.plan.id,locationId)
        .then(locationInfo => this.showStaticMap(locationInfo))
      } else {
        this.selectedLocationInfo = null
      }
    })

    state.clearViewMode.subscribe((clear) => {
      if(clear) this.selectedLocationInfo = null
    })
  }

  // Get the location Information
  getLocationInfo(planId, id, callback) {
    return this.$http.get('/locations/' + planId + '/' + id + '/show')
      .then((response) => {
        return response.data
      })
  }

  showStaticMap(locationInfo) {
    this.selectedLocationInfo = locationInfo
    this.showAttributes = this.currentUser.rol === 'sales' && !angular.equals(locationInfo.attributes, {})
    
    var google_maps_key = this.configuration.google_maps_key
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
  }

  showDetailLocationInfo() {
    this.selectedLocationInfo.id = +this.selectedLocationInfo.location_id      
    this.state.showDetailedLocationInfo.next(this.selectedLocationInfo)
  }

  viewSelectedLocation(selectedLocation) {
    this.getLocationInfo(this.plan.id,selectedLocation.id)
    .then(locationInfo => this.showStaticMap(locationInfo))
    .then(() => {
      map.setCenter({ lat: this.selectedLocationInfo.geog.coordinates[1], lng: this.selectedLocationInfo.geog.coordinates[0] })
    })
  }

}

ViewModeLocationController.$inject = ['$http','state','configuration']

export default ViewModeLocationController