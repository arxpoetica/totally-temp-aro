class LocationDetailController {

  constructor($http, $timeout, state, locationDetailPropertiesFactory) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.locationDetailPropertiesFactory = locationDetailPropertiesFactory
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
          
          this.selectedLocationObjectId = feature.object_id
          this.toggleAuditLog = false
          this.updateSelectedState(feature, locationId)
          this.getLocationInfo(this.plan.id,locationId,feature.object_id)
            .then(locationInfo => this.showStaticMap(locationInfo))
            .catch((err) => console.error(err))
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

  getAttributeValue(attributes, key) {
    return attributes.filter((item) => item.key === key)[0].value
  }

  // Get the location Information
  getLocationInfo(planId, id, objectId){
    return this.$http.get(`/locations/${planId}/${id}/show`)
      .then((result) => {
        if (this.state.configuration.perspective.locationDetails.showDefaultDetails) {
          return Promise.resolve(result.data)
        } else if (this.state.configuration.perspective.locationDetails.showSalesDetails) {
          result.data.latitude = result.data.geog.coordinates[1]
          result.data.longitude = result.data.geog.coordinates[0]
          var locationProperties = this.locationDetailPropertiesFactory.getLocationDetailPropertiesFor(result.data)
          locationProperties.geog = result.data.geog
          return Promise.resolve(locationProperties)
        } else {
          return Promise.reject('You must have either default or sales details shown')
        }
      })
      .catch((err) => console.error(err))
  }
  
  updateSelectedState(feature, id){
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.location = {}
    if ('undefined' != typeof feature && 'undefined' != typeof id){
      selectedViewFeaturesByType.location[ id ] = feature
    }
    this.state.StateViewMode.reloadSelectedViewFeaturesByType(this.state,selectedViewFeaturesByType)
  }
  
  showStaticMap(locationInfo) {
    this.selectedLocationInfo = locationInfo
    this.showAttributes = (this.currentUser.perspective === 'sales_engineer' || this.currentUser.perspective === 'account_exec') && !angular.equals(locationInfo.attributes, {})
    
    var google_maps_key = this.state.configuration.google_maps_key
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
    this.$timeout()
  }

  showDetailLocationInfo() {
    this.selectedLocationInfo.id = +this.selectedLocationInfo.location_id      
    this.state.showDetailedLocationInfo.next(this.selectedLocationInfo)
  }

  viewSelectedLocation(selectedLocation) {
    //console.log(selectedLocation)
    this.selectedLocationObjectId = selectedLocation.objectId
    this.updateSelectedState(selectedLocation, selectedLocation.id)
    this.getLocationInfo(this.plan.id,selectedLocation.id,selectedLocation.objectId)
    .then(locationInfo => this.showStaticMap(locationInfo))
    .then(() => {
      map.setCenter({ lat: this.selectedLocationInfo.geog.coordinates[1], lng: this.selectedLocationInfo.geog.coordinates[0] })
      const ZOOM_FOR_LOCATION_SEARCH = 17
      this.state.requestSetMapZoom.next(ZOOM_FOR_LOCATION_SEARCH)
    })
  }
  
  $onDestroy() {
    this.planSubscription.unsubscribe()
    this.mapFeaturesSelectedSubscription.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
  }
}

LocationDetailController.$inject = ['$http', '$timeout', 'state', 'locationDetailPropertiesFactory']

let locationDetail = {
  templateUrl: '/components/sidebar/view/location-detail/location-detail.html',
  bindings: {},
  controller: LocationDetailController
}

export default locationDetail