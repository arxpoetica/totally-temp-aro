/* global app localStorage map */
app.service('state',['$rootScope', 'map_layers', 'configuration', ($rootScope, map_layers, configuration) => {
  var key = null
  var state = null;
  var service = {}
  service.INVALID_PLAN_ID = -1;

  ;['dragend', 'zoom_changed'].forEach((event_name) => {
    $rootScope.$on('map_' + event_name, () => {
      if (!key) return

      var center = map.getCenter()
      if (!center) return
      var literal = { lat: center.lat(), lng: center.lng() }
      service.set('mapCenter', JSON.stringify(literal))
      service.set('mapZoom', map.getZoom())
    })
  })

  // Initialize the state of the application
  var initializeState = function() {

    service.planId = service.INVALID_PLAN_ID    // The plan ID that is currently selected
    service.GLOBAL_DATASOURCE_ID = 1

    // A list of location types to show in the locations layer
    service.locationTypes = []
    // A list of location data sources to show in the locations layer
    service.locationDataSources = {
      useGlobalBusiness: true,
      useGlobalHousehold: true,
      useGlobalCellTower: true,
      useUploaded: []
    }

    // Iterate over the business segments in the configuration
    if (configuration && configuration.locationCategories && configuration.locationCategories.business && configuration.locationCategories.business.segments) {
      Object.keys(configuration.locationCategories.business.segments).forEach((key) => {
        var segment = configuration.locationCategories.business.segments[key];
        if (segment.show) {
          service.locationTypes.push({
            type: 'business',
            key: key,
            label: segment.label,
            checked: false,
            icon: configuration.locationCategories.mapIconFolder + 'businesses_' + key + '_default.png'
          })
        }
      })
    }

    // Show residential/household units
    if (configuration && configuration.locationCategories && configuration.locationCategories.household) {
      if (configuration.locationCategories.household.show) {
        service.locationTypes.push({
          type: 'household',
          key: 'household',
          label: configuration.locationCategories.household.label,
          checked: false,
          icon: configuration.locationCategories.mapIconFolder + 'households_default.png'
        })
      }
    }

    // Show Towers
    if (configuration && configuration.locationCategories && configuration.locationCategories.celltower) {
      if (configuration.locationCategories.celltower.show) {
        service.locationTypes.push({
          type: 'celltower',
          key: 'celltower',
          label: configuration.locationCategories.celltower.label,
          checked: false,
          icon: configuration.locationCategories.mapIconFolder + 'tower.png'
        })
      }
    }
}
  initializeState()

  // When configuration is loaded from the server, update it in the state
  $rootScope.$on('configuration_loaded', () => {
    initializeState()
  })

  service.clearPlan = (plan) => {
    key = null
    initializeState()
    localStorage.removeItem(`plan_${plan.id}`)
  }

  service.loadPlan = (plan) => {
    service.planId = +plan.id
    if (!plan) {
      key = null
      initializeState()
    } else {
      key = `plan_${plan.id}`
      try {
        state = JSON.parse(localStorage.getItem(key)) || {}
      } catch (err) {
        state = {}
      }
    }
  }

  service.set = (attr, value) => {
    if (state.planId === service.INVALID_PLAN_ID) return
    state[attr] = value
    localStorage.setItem(key, JSON.stringify(state))
  }

  service.get = (attr, value, def) => {
    if (state.planId === service.INVALID_PLAN_ID) return def
    return state[attr] || def
  }

  return service
}])
