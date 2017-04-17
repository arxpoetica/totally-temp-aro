/* global app localStorage map */
app.service('state',['$rootScope', 'map_layers', 'configuration', ($rootScope, map_layers, configuration) => {
  var key = null
  const INVALID_PLAN_ID = -1;
  var state = null;
  var service = {}

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
    service.planId = INVALID_PLAN_ID;
    service.locations = {
      types: [],
      dataSources: {
        globalBusinesses: false,
        globalResidential: false,
        globalTowers: false,
        uploaded: []
      }
    }

    // Iterate over the business segments in the configuration
    if (configuration && configuration.locationCategories && configuration.locationCategories.businesses && configuration.locationCategories.businesses.segments) {
      Object.keys(configuration.locationCategories.businesses.segments).forEach((key) => {
        var segment = configuration.locationCategories.businesses.segments[key];
        if (segment.show) {
          service.locations.types.push({
            type: 'business',
            key: key,
            label: segment.label,
            icon: configuration.locationCategories.mapIconFolder + 'businesses_' + key + '_default.png',
            checked: false
          })
        }
      })
    }

    // Show residential/household units
    if (configuration && configuration.locationCategories && configuration.locationCategories.households) {
      if (configuration.locationCategories.households.show) {
        service.locations.types.push({
          type: 'household',
          key: 'households',
          label: configuration.locationCategories.households.label,
          icon: configuration.locationCategories.mapIconFolder + 'households_default.png',
          checked: false
        })
      }
    }

    // Show Towers
    if (configuration && configuration.locationCategories && configuration.locationCategories.towers) {
      if (configuration.locationCategories.towers.show) {
        service.locations.types.push({
          type: 'tower',
          key: 'towers',
          label: configuration.locationCategories.towers.label,
          icon: configuration.locationCategories.mapIconFolder + 'tower.png',
          checked: false
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
    if (state.planId === INVALID_PLAN_ID) return
    state[attr] = value
    localStorage.setItem(key, JSON.stringify(state))
  }

  service.get = (attr, value, def) => {
    if (state.planId === INVALID_PLAN_ID) return def
    return state[attr] || def
  }

  return service
}])
