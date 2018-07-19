class ViewModeLocationController {

  constructor($http, $timeout, state, configuration) {
    this.$http = $http
    this.state = state
    this.configuration = configuration
    this.plan = null
    this.selectedLocationInfo = null
    this.map_url = null
    this.currentUser = state.loggedInUser
    this.selectedLocation = null

    this.planSubscription = state.plan.subscribe((plan) => {
      this.plan = plan
    })

    this.mapFeaturesSelectedSubscription = state.mapFeaturesSelectedEvent.subscribe((options) => {
      //In ruler mode click should not perform any view action's
      if(this.state.selectedDisplayMode.getValue() === state.displayModes.VIEW && 
        this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.SINGLE_PLAN_TARGET &&
        //Don't open location view mode when in location edit view
        this.state.activeViewModePanel != this.state.viewModePanels.EDIT_LOCATIONS &&
        !this.state.isRulerEnabled) {
      var locationsList = []
      if (options.hasOwnProperty('locations')) locationsList = options.locations
      
      
      // Update state's selected location list 
      if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
        
        var selectedFeature = null
        var locationId = null
        for (var featureI = 0; featureI < locationsList.length; featureI++){
          var feature = locationsList[featureI]
          console.log(feature)
          if ( feature.hasOwnProperty('location_id') ){
            locationId = feature.location_id
          }else if ( feature.hasOwnProperty('id') ){
            locationId = feature.id
          }
          
          if (null != locationId){
            selectedFeature = feature
            break
          }
        }
        
        this.updateSelectedState(feature, locationId)
        this.getLocationInfo(this.plan.id,locationId).then(locationInfo => this.showStaticMap(locationInfo))
      } else {
        this.selectedLocationInfo = null
      }
      }
    })
    
    this.clearViewModeSubscription = state.clearViewMode.subscribe((clear) => {
      if(clear){
        this.selectedLocationInfo = null
        this.updateSelectedState()
      }
    })
  }
  // Get the location Information
  getLocationInfo(planId, id, callback){
    return this.$http.get('/locations/' + planId + '/' + id + '/show').then((response) => {
      return response.data
    })
  }
  
  updateSelectedState(feature, id){
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.location = {}
    if ('undefined' != typeof feature && 'undefined' != typeof id){
      selectedViewFeaturesByType.location[ id ] = feature
    }
    this.state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
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
    
    this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
  }

  showDetailLocationInfo() {
    this.selectedLocationInfo.id = +this.selectedLocationInfo.location_id      
    this.state.showDetailedLocationInfo.next(this.selectedLocationInfo)
  }

  viewSelectedLocation(selectedLocation) {
    //console.log(selectedLocation)
    this.updateSelectedState(selectedLocation, selectedLocation.id)
    this.getLocationInfo(this.plan.id,selectedLocation.id)
    .then(locationInfo => this.showStaticMap(locationInfo))
    .then(() => {
      map.setCenter({ lat: this.selectedLocationInfo.geog.coordinates[1], lng: this.selectedLocationInfo.geog.coordinates[0] })
    })
  }
  
  $onDestroy() {
    this.planSubscription.unsubscribe()
    this.mapFeaturesSelectedSubscription.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
  }
}

ViewModeLocationController.$inject = ['$http','$timeout','state','configuration']

export default ViewModeLocationController