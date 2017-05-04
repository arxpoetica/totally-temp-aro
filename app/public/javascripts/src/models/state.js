/* global app localStorage map */
app.service('state', ['$rootScope', '$http', 'map_layers', 'configuration', 'regions', 'optimization', ($rootScope, $http, map_layers, configuration, regions, optimization) => {
  var key = null
  var state = null;
  var OPTIMIZATION_DATA_SOURCE_GLOBAL = 1
  var service = {}
  service.INVALID_PLAN_ID = -1
  service.DS_GLOBAL_BUSINESSES = -3
  service.DS_GLOBAL_HOUSEHOLDS = -2
  service.DS_GLOBAL_CELLTOWER = -1

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
  var initializeState = function () {

    service.planId = service.INVALID_PLAN_ID    // The plan ID that is currently selected

    // A list of location types to show in the locations layer
    service.locationTypes = []

    //location datasources for dropdown
    service.defaultDataSources = [
      {
        dataSourceId: service.DS_GLOBAL_BUSINESSES,
        name: "Global Businesses"
      },
      {
        dataSourceId: service.DS_GLOBAL_HOUSEHOLDS,
        name: "Global Households"
      },
      {
        dataSourceId: service.DS_GLOBAL_CELLTOWER,
        name: "Global CellTower"
      }
    ]
    service.allDataSources = service.defaultDataSources.slice()

    // A list of location data sources to show in the locations layer
    service.selectedDataSources = service.defaultDataSources.slice()

    // Optimization options
    service.optimizationOptions = {
      algorithm: 'UNCONSTRAINED',
      fiberNetworkConstraints: {
        routingMode: 'DIRECT_ROUTING',
        cellNodeConstraints: {
          cellRadius: 300.0,
          polygonStrategy: 'FIXED_RADIUS',
          tiles: [],
          selectedTile: null
        }
      },
      processLayers: [],
      budget: 10000000,
      preIrrThreshold: 0.1,
      customOptimization: null,
      fiberSourceIds: [],
      threshold: null,
      routeGenerationOptions: [
        { id: 'T', value: 'A Route', checked: false },
        { id: 'A', value: 'B Route', checked: false },
        { id: 'B', value: 'C Route', checked: false },
        { id: 'C', value: 'D Route', checked: false }
      ],
      technologies: [
        { id: 'Fiber', label: 'Fiber', checked: true},
        { id: 'FiveG', label: '5G', checked: false}
      ],
      selectedLayer: null
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

  // Load tile information from the server
  $http({
	 url: '/morphology/tiles',
	 method: 'GET'
	})
	.success((response) => {
	  service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.tiles = response
    service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.selectedTile 
      = (service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.tiles.length > 0)
        ? service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.tiles[0]
        : null
	})

  initializeState()

  // When configuration is loaded from the server, update it in the state
  $rootScope.$on('configuration_loaded', () => {
    initializeState()
  })

  // Reload uploaded data sources
  service.reloadDatasources = (callback) => {
    $http.get('/datasources').success((response) => {
      service.allDataSources = service.defaultDataSources.slice()
      service.selectedDataSources = service.defaultDataSources.slice()   // Always keep the global data sources selected
      service.allDataSources = service.allDataSources.concat(response)
      callback && callback(response)
    })
  }

  // Add location types to a POST body that we will send to aro-service for performing optimization
  var addLocationTypesToBody = (postBody) => {
    var selectedLocationTypes = service.locationTypes.filter((item) => item.checked)
    postBody.locationTypes = _.pluck(selectedLocationTypes, 'key')
  }

  // Add global data sources to a POST body that we will send to aro-service for performing optimization
  var addGlobalDataSourcesToBody = (postBody) => {
    postBody.locationDataSources = postBody.locationDataSources || {}
    if (service.isDataSourceSelected(service.DS_GLOBAL_BUSINESSES)) {
      postBody.locationDataSources.business = [OPTIMIZATION_DATA_SOURCE_GLOBAL]
    }
    if (service.isDataSourceSelected(service.DS_GLOBAL_HOUSEHOLDS)) {
      postBody.locationDataSources.household = [OPTIMIZATION_DATA_SOURCE_GLOBAL]
    }
    if (service.isDataSourceSelected(service.DS_GLOBAL_CELLTOWER)) {
      postBody.locationDataSources.celltower = [OPTIMIZATION_DATA_SOURCE_GLOBAL]
    }
  }

  // Add user uploaded data sources to a POST body that we will send to aro-service for performing optimization
  var addUserUploadedDataSourcesToBody = (postBody) => {
    postBody.locationDataSources = postBody.locationDataSources || {}
    // Get all uploaded data sources except the global data sources
    var uploadedDataSources = service.selectedDataSources.filter((item) => (item.dataSourceId != service.DS_GLOBAL_BUSINESSES)
                                                                           && (item.dataSourceId != service.DS_GLOBAL_HOUSEHOLDS)
                                                                           && (item.dataSourceId != service.DS_GLOBAL_CELLTOWER))
    var uploadedDataSourceIds = _.pluck(uploadedDataSources, 'dataSourceId')

    if (uploadedDataSourceIds.length > 0) {
      postBody.locationDataSources.business = postBody.locationDataSources.business || [];
      postBody.locationDataSources.business = postBody.locationDataSources.business.concat(uploadedDataSourceIds);

      postBody.locationDataSources.household = postBody.locationDataSources.household || [];
      postBody.locationDataSources.household = postBody.locationDataSources.household.concat(uploadedDataSourceIds);

      postBody.locationDataSources.celltower = postBody.locationDataSources.celltower || [];
      postBody.locationDataSources.celltower = postBody.locationDataSources.celltower.concat(uploadedDataSourceIds);
    }
  }

  // Add algorithm parameters to a POST body that we will send to aro-service for performing optimization
  var addAlgorithmParametersToBody = (postBody) => {
    postBody.algorithm = service.optimizationOptions.algorithm
    if (service.optimizationOptions.algorithm === 'TABC') {
      var generations = service.optimizationOptions.routeGenerationOptions.filter((item) => item.checked)
      postBody.customOptimization = {
        name: 'TABC',
        map: { generations: generations.join(',') }
      }
    }
    postBody.budget = service.optimizationOptions.budget
    postBody.preIrrThreshold = service.optimizationOptions.preIrrThreshold
    postBody.threshold = service.optimizationOptions.coverageThreshold
  }

  // Add regions to a POST body that we will send to aro-service for performing optimization
  var addRegionsToBody = (postBody) => {
    var standardTypes = ['cma_boundaries', 'census_blocks', 'county_subdivisions', 'user_defined', 'wirecenter', 'cran', 'directional_facility']
    postBody.geographies = regions.selectedRegions.map((i) => {
      var info = { name: i.name, id: i.id, type: i.type, layerId: i.layerId }
      // geography information may be too large so we avoid to send it for known region types
      if (standardTypes.indexOf(i.type) === -1) {
        info.geog = i.geog
      }
      if (i.layerId) {
        processingLayers.push(i.layerId)
      }
      return info
    })
    postBody.selectionMode = (optimization.getMode() === 'boundaries') ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
    if (service.optimizationOptions.selectedLayer) {
      postBody.processingLayers = [service.optimizationOptions.selectedLayer.id]
    }
  }

  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (postBody) => {
    postBody.fiberNetworkConstraints = {}
    postBody.fiberNetworkConstraints.routingMode = service.optimizationOptions.fiberNetworkConstraints.routingMode
    postBody.fiberNetworkConstraints.cellNodeConstraints = {}
    postBody.fiberNetworkConstraints.cellNodeConstraints.cellRadius = service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.cellRadius
    postBody.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy = service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy
    var selectedTile = service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.selectedTile
    if (selectedTile) {
      postBody.fiberNetworkConstraints.cellNodeConstraints.tileSystemId = selectedTile.id
    }
  }

  // Add technologies to a POST body that we will send to aro-service for optimization
  var addTechnologiesToBody = (postBody) => {
    postBody.networkTypes = []
    service.optimizationOptions.technologies.forEach((technology) => {
      if (technology.checked) {
        postBody.networkTypes.push(technology.id)
      }
    })
  }

  // Get a POST body that we will send to aro-service for performing optimization
  service.getOptimizationBody = () => {

    var optimizationBody = {}

    addLocationTypesToBody(optimizationBody)
    addGlobalDataSourcesToBody(optimizationBody)
    addUserUploadedDataSourcesToBody(optimizationBody)
    addAlgorithmParametersToBody(optimizationBody)
    addRegionsToBody(optimizationBody)
    addFiberNetworkConstraintsToBody(optimizationBody)
    addTechnologiesToBody(optimizationBody)

    optimizationBody.fiberSourceIds = service.optimizationOptions.fiberSourceIds

    return optimizationBody
  }

  // Load location types from a POST body object that is sent to the optimization engine
  var loadLocationTypesFromBody = (postBody) => {
    service.locationTypes.forEach((locationType) => locationType.checked = false)
    postBody.locationTypes.forEach((locationType) => {
      var serviceLocationTypeObj = service.locationTypes.filter((item) => item.key === locationType)[0]
      if (serviceLocationTypeObj) {
        serviceLocationTypeObj.checked = true
      }
    })
  }

  // Load data sources from a POST body object that is sent to the optimization engine
  var loadDataSourcesFromBody = (postBody) => {
    service.selectedDataSources = []
    var setOfUploadedDataSources = new Set()
    if (postBody.locationDataSources.business) {
      postBody.locationDataSources.business.forEach((item) => setOfUploadedDataSources.add(item.dataSourceId))
      if (postBody.locationDataSources.business.indexOf(OPTIMIZATION_DATA_SOURCE_GLOBAL) >= 0) {
        var globalBusinessesDataSource = service.defaultDataSources.filter((item) => item.dataSourceId === service.DS_GLOBAL_BUSINESSES)[0]
        service.selectedDataSources.push(globalBusinessesDataSource)
      }
    }
    if (postBody.locationDataSources.household) {
      postBody.locationDataSources.household.forEach((item) => setOfUploadedDataSources.add(item.dataSourceId))
      if (postBody.locationDataSources.household.indexOf(OPTIMIZATION_DATA_SOURCE_GLOBAL) >= 0) {
        var globalHouseholdsDataSource = service.defaultDataSources.filter((item) => item.dataSourceId === service.DS_GLOBAL_HOUSEHOLDS)[0]
        service.selectedDataSources.push(globalHouseholdsDataSource)
      }
    }
    if (postBody.locationDataSources.celltower) {
      postBody.locationDataSources.celltower.forEach((item) => setOfUploadedDataSources.add(item.dataSourceId))
      if (postBody.locationDataSources.celltower.indexOf(OPTIMIZATION_DATA_SOURCE_GLOBAL) >= 0) {
        var globalCellTowerDataSource = service.defaultDataSources.filter((item) => item.dataSourceId === service.DS_GLOBAL_CELLTOWER)[0]
        service.selectedDataSources.push(globalCellTowerDataSource)
      }
    }

    // At this point, the setOfUploadedDataSources will have all data sources selected. Remove the global data source from the list.
    // Note that the "global businesses" data source has id of DS_GLOBAL_BUSINESSES but this is not the same as the global data source.
    // This is because all "global" data sources go in as id 1 to the optimization engine.
    setOfUploadedDataSources.delete(OPTIMIZATION_DATA_SOURCE_GLOBAL)
    // And then add the uploaded data sources to the list
    setOfUploadedDataSources.forEach((uploadedDataSourceId) => {
      var uploadedDataSource = service.allDataSources.filter((item) => item.dataSourceId === uploadedDataSourceId)[0]
      if (uploadedDataSource) {
        service.selectedDataSources.push(uploadedDataSource)
      }
    })
  }

  // Load algorithm parameters from a POST body object that is sent to the optimization engine
  var loadAlgorithmParametersFromBody = (postBody) => {
    service.optimizationOptions.algorithm = postBody.algorithm

    service.optimizationOptions.budget = postBody.budget
    service.optimizationOptions.preIrrThreshold = postBody.preIrrThreshold
    if (postBody.selectionMode === 'SELECTED_AREAS') {
      optimization.setMode('boundaries')
    } else if (postBody.selectionMode === 'SELECTED_LOCATIONS') {
      optimization.setMode('targets')
    }
  }

  // Load fiber network constraints from a POST body object that is sent to the optimization engine
  var loadFiberNetworkConstraintsFromBody = (postBody) => {
    var cellNodeConstraintsObj = service.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints
    cellNodeConstraintsObj.cellRadius = postBody.fiberNetworkConstraints.cellNodeConstraints.cellRadius
    cellNodeConstraintsObj.polygonStrategy = postBody.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy
    var selectedTile = cellNodeConstraintsObj.tiles.filter((item) => item.id === postBody.fiberNetworkConstraints.cellNodeConstraints.tileSystemId)
    if (selectedTile.length === 1) {
      cellNodeConstraintsObj.selectedTile = selectedTile[0]
    }
  }

  // Load technologies from a POST body object that is sent to the optimization engine
  var loadTechnologiesFromBody = (postBody) => {
    service.optimizationOptions.technologies.forEach((technology) => technology.checked = false)
    postBody.networkTypes.forEach((networkType) => {
      var matchedTechnology = service.optimizationOptions.technologies.filter((technology) => technology.id.toUpperCase() === networkType.toUpperCase())
      if (matchedTechnology && matchedTechnology.length === 1) {
        matchedTechnology[0].checked = true
      }
    })
  }

  // Load optimization options from a JSON string
  service.loadOptimizationOptionsFromJSON = (json) => {

    var postBody = JSON.parse(json)

    loadLocationTypesFromBody(postBody)
    loadDataSourcesFromBody(postBody)
    loadAlgorithmParametersFromBody(postBody)
    loadFiberNetworkConstraintsFromBody(postBody)
    loadTechnologiesFromBody(postBody)

    service.optimizationOptions.fiberSourceIds = postBody.fiberSourceIds.slice()

    // Select geographies
    regions.removeAllGeographies()
    var geographyIds = []
    postBody.geographies.forEach((geography) => geographyIds.push(geography.id))
    // Note that we are returning a promise that will be resolved when the UI loads all selected regions
    return regions.selectGeographyFromIds(geographyIds)
  }

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

  service.isDataSourceSelected = function (ds) {
    var existingDataSources = _.pluck(service.selectedDataSources , 'dataSourceId');
    return existingDataSources.indexOf(ds) != -1;
  }

  return service
}])
