class LocationDetailController {
  constructor ($http, $timeout, $ngRedux, state, locationDetailPropertiesFactory) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.locationDetailPropertiesFactory = locationDetailPropertiesFactory
    this.selectedLocationInfo = null
    // this.map_url = null
    this.currentUser = state.loggedInUser
    this.selectedLocation = null
    this.toggleOtherAttributes = false
    this.roicPlanSettings = null

    this.mapFeaturesSelectedSubscription = state.mapFeaturesSelectedEvent.subscribe((options) => {
      // In ruler mode click should not perform any view action's
      if (this.state.selectedDisplayMode.getValue() === state.displayModes.VIEW &&
        this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.SINGLE_PLAN_TARGET &&
        // Don't open location view mode when in location edit view
        this.state.activeViewModePanel != this.state.viewModePanels.EDIT_LOCATIONS &&
        !this.state.isRulerEnabled) {
        var locationsList = []
        if (options.hasOwnProperty('locations')) locationsList = options.locations

        // Update state's selected location list
        if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
          var selectedFeature = null
          var locationId = null
          for (var featureI = 0; featureI < locationsList.length; featureI++) {
            var feature = locationsList[featureI]
            if (feature.hasOwnProperty('location_id')) {
              locationId = feature.location_id
            } else if (feature.hasOwnProperty('id')) {
              locationId = feature.id
            }

            if (locationId != null) {
              selectedFeature = feature
              break
            }
          }

          this.selectedLocationObjectId = feature.object_id
          this.toggleAuditLog = false
          this.updateSelectedState(feature, locationId)
          this.getLocationInfo(this.state.plan.id, locationId)
            .then(locationInfo => this.showStaticMap(locationInfo))
            .catch((err) => console.error(err))
        } else {
          this.selectedLocationInfo = null
        }
      }
    })

    this.clearViewModeSubscription = state.clearViewMode.subscribe((clear) => {
      if (clear) {
        this.selectedLocationInfo = null
        this.updateSelectedState()
      }
    })
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  getAttributeValue (attributes, key) {
    return attributes.filter((item) => item.key === key)[0].value
  }

  // Get the location Information
  getLocationInfo (planId, id) {
    return this.$http.get(`/locations/${planId}/${id}/show`)// note: change this for a service endpoint?
      .then((result) => {
        var locationIds = []
        if (result.data.hasOwnProperty('locSourceIds')) {
          if (result.data.locSourceIds.hasOwnProperty('bizSourceIds') && result.data.locSourceIds.bizSourceIds.object_ids) {
            locationIds = locationIds.concat(result.data.locSourceIds.bizSourceIds.object_ids)
          }
          if (result.data.locSourceIds.hasOwnProperty('hhSourceIds') && result.data.locSourceIds.hhSourceIds.object_ids) {
            locationIds = locationIds.concat(result.data.locSourceIds.hhSourceIds.object_ids)
          }
          if (result.data.locSourceIds.hasOwnProperty('towerSourceIds') && result.data.locSourceIds.towerSourceIds.object_ids) {
            locationIds = locationIds.concat(result.data.locSourceIds.towerSourceIds.object_ids)
          }
        }

        this.roicPlanSettings = {
          'analysis_type': 'LOCATION_ROIC',
          'locationIds': locationIds,
          'planId': planId,
          'projectTemplateId': 1
        }

        if (this.state.configuration.perspective.locationDetails.showDefaultDetails) {
          return Promise.resolve(result.data)
        } else if (this.state.configuration.perspective.locationDetails.showSalesDetails) {
          result.data.latitude = result.data.geog.coordinates[1]
          result.data.longitude = result.data.geog.coordinates[0]
          var locationProperties = this.locationDetailPropertiesFactory.getLocationDetailPropertiesFor(result.data)
          locationProperties.geog = result.data.geog
          locationProperties.location_id = result.data.location_id
          locationProperties.attributes = result.data.attributes
          return Promise.resolve(locationProperties)
        } else {
          return Promise.reject('You must have either default or sales details shown')
        }
      })
      .catch((err) => console.error(err))
  }

  updateSelectedState (feature, id) {
    var newSelection = this.state.cloneSelection()
    newSelection.editable.location = {}
    if (typeof feature !== 'undefined' && typeof id !== 'undefined') {
      newSelection.editable.location[ id ] = feature
    }
    this.state.selection = newSelection
  }

  showStaticMap (locationInfo) {
    this.selectedLocationInfo = locationInfo
    this.selectedLocationInfo.attributes = this.selectedLocationInfo.attributes.filter(val => val != null)
    this.showAttributes = (this.currentUser.perspective === 'sales_engineer' || this.currentUser.perspective === 'account_exec') && !angular.equals(locationInfo.attributes, {})
    this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
    this.$timeout()
  }

  showDetailLocationInfo () {
    this.selectedLocationInfo.id = +this.selectedLocationInfo.location_id
    this.state.showDetailedLocationInfo.next(this.selectedLocationInfo)
  }

  viewSelectedLocation (selectedLocation) {
    this.selectedLocationObjectId = selectedLocation.objectId
    this.updateSelectedState(selectedLocation, selectedLocation.id)
    this.getLocationInfo(this.state.plan.id, selectedLocation.id)
      .then(locationInfo => this.showStaticMap(locationInfo))
      .then(() => {
        map.setCenter({ lat: this.selectedLocationInfo.geog.coordinates[1], lng: this.selectedLocationInfo.geog.coordinates[0] })
        const ZOOM_FOR_LOCATION_SEARCH = 17
        this.state.requestSetMapZoom.next(ZOOM_FOR_LOCATION_SEARCH)
      })
  }

  $onDestroy () {
    this.mapFeaturesSelectedSubscription.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }
}

LocationDetailController.$inject = ['$http', '$timeout', '$ngRedux', 'state', 'locationDetailPropertiesFactory']

let locationDetail = {
  templateUrl: '/components/sidebar/view/location-detail/location-detail.html',
  bindings: {},
  controller: LocationDetailController
}

export default locationDetail
