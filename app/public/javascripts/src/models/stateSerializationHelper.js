/**
 * When we perform optimization, we send a POST request to aro-service with the optimization parameters as a POST body.
 * This service helps us to convert the "state" object to and from this POST body.
 * Services like "state" and "region" are intentionally not injected into this, instead we send them in as parameters.
 */
app.service('stateSerializationHelper', ['$q', ($q) => {

  var OPTIMIZATION_DATA_SOURCE_GLOBAL = 1
  var stateSerializationHelper = {}

  // ------------------------------------------------------------------------------------------------------------------
  // Begin section - state to POST body
  // ------------------------------------------------------------------------------------------------------------------

  // Get a POST body that we will send to aro-service for performing optimization
  stateSerializationHelper.getOptimizationBody = (state, optimization, regions) => {

    var optimizationBody = {}

    addLocationTypesToBody(state, optimizationBody)
    addGlobalDataSourcesToBody(state, optimizationBody)
    addUserUploadedDataSourcesToBody(state, optimizationBody)
    addAlgorithmParametersToBody(state, optimizationBody)
    addRegionsToBody(state, optimization, regions, optimizationBody)
    addFiberNetworkConstraintsToBody(state, optimizationBody)
    addTechnologiesToBody(state, optimizationBody)
    optimizationBody.fiberSourceIds = state.optimizationOptions.fiberSourceIds

    return optimizationBody
  }

  // Add location types to a POST body that we will send to aro-service for performing optimization
  var addLocationTypesToBody = (state, postBody) => {
    var selectedLocationTypes = state.locationTypes.filter((item) => item.checked)
    postBody.locationTypes = _.pluck(selectedLocationTypes, 'key')
  }

  // Add global data sources to a POST body that we will send to aro-service for performing optimization
  var addGlobalDataSourcesToBody = (state, postBody) => {
    postBody.locationDataSources = postBody.locationDataSources || {}
    if (state.isDataSourceSelected(state.DS_GLOBAL_BUSINESSES)) {
      postBody.locationDataSources.business = [OPTIMIZATION_DATA_SOURCE_GLOBAL]
    }
    if (state.isDataSourceSelected(state.DS_GLOBAL_HOUSEHOLDS)) {
      postBody.locationDataSources.household = [OPTIMIZATION_DATA_SOURCE_GLOBAL]
    }
    if (state.isDataSourceSelected(state.DS_GLOBAL_CELLTOWER)) {
      postBody.locationDataSources.celltower = [OPTIMIZATION_DATA_SOURCE_GLOBAL]
    }
  }

  // Add user uploaded data sources to a POST body that we will send to aro-service for performing optimization
  var addUserUploadedDataSourcesToBody = (state, postBody) => {
    postBody.locationDataSources = postBody.locationDataSources || {}
    // Get all uploaded data sources except the global data sources
    var uploadedDataSources = state.selectedDataSources.filter((item) => (item.dataSourceId != state.DS_GLOBAL_BUSINESSES)
                                                                           && (item.dataSourceId != state.DS_GLOBAL_HOUSEHOLDS)
                                                                           && (item.dataSourceId != state.DS_GLOBAL_CELLTOWER))
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
  var addAlgorithmParametersToBody = (state, postBody) => {
    // All this "uiSelectedAlgorithm" stuff is because the UI has muliple options that map to (postBody.algorithm === 'IRR')
    postBody.algorithm = state.optimizationOptions.uiSelectedAlgorithm.algorithm
    postBody.uiSelectedAlgorithmId = state.optimizationOptions.uiSelectedAlgorithm.id
    if (state.optimizationOptions.uiSelectedAlgorithm.algorithm === 'TABC') {
      var generations = state.optimizationOptions.routeGenerationOptions.filter((item) => item.checked)
      postBody.customOptimization = {
        name: 'TABC',
        map: { generations: generations.join(',') }
      }
    }

    postBody.financialConstraints = state.optimizationOptions.financialConstraints
    postBody.threshold = state.optimizationOptions.threshold
  }

  // Add regions to a POST body that we will send to aro-service for performing optimization
  var addRegionsToBody = (state, optimization, regions, postBody) => {
    var standardTypes = ['cma_boundaries', 'census_blocks', 'county_subdivisions', 'user_defined', 'wirecenter', 'cran', 'directional_facility']
    postBody.geographies = regions.selectedRegions.map((i) => {
      var info = { name: i.name, id: i.id, type: i.type, layerId: i.layerId }
      // geography information may be too large so we avoid to send it for known region types
      if (standardTypes.indexOf(i.type) === -1) {
        info.geog = i.geog
      }
      if (i.layerId) {
        processLayers.push(i.layerId)
      }
      return info
    })
    postBody.analysisSelectionMode = (optimization.getMode() === 'boundaries') ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
    if (state.optimizationOptions.selectedLayer) {
      postBody.processLayers = [state.optimizationOptions.selectedLayer.id]
    }
  }

  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (state, postBody) => {
    postBody.fiberNetworkConstraints = {}
    postBody.fiberNetworkConstraints.routingMode = state.optimizationOptions.fiberNetworkConstraints.routingMode
    postBody.fiberNetworkConstraints.cellNodeConstraints = {}
    postBody.fiberNetworkConstraints.cellNodeConstraints.cellRadius = state.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.cellRadius
    postBody.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy = state.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy
    var selectedTile = state.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints.selectedTile
    if (selectedTile) {
      postBody.fiberNetworkConstraints.cellNodeConstraints.tileSystemId = selectedTile.id
    }
  }

  // Add technologies to a POST body that we will send to aro-service for optimization
  var addTechnologiesToBody = (state, postBody) => {
    postBody.networkTypes = []
    state.optimizationOptions.technologies.forEach((technology) => {
      if (technology.checked) {
        postBody.networkTypes.push(technology.id)
      }
    })
  }

  // ------------------------------------------------------------------------------------------------------------------
  // End section - state to POST body
  // ------------------------------------------------------------------------------------------------------------------

  // ------------------------------------------------------------------------------------------------------------------
  // Begin section - POST body to state
  // ------------------------------------------------------------------------------------------------------------------

  // Load optimization options from a JSON string
  stateSerializationHelper.loadStateFromJSON = (state, optimization, regions, json) => {

    var postBody = JSON.parse(json)

    loadLocationTypesFromBody(state, postBody)
    loadDataSourcesFromBody(state, postBody)
    loadAlgorithmParametersFromBody(state, optimization, postBody)
    loadFiberNetworkConstraintsFromBody(state, postBody)
    loadTechnologiesFromBody(state, postBody)

    state.optimizationOptions.fiberSourceIds = postBody.fiberSourceIds.slice()

    // Select geographies
    regions.removeAllGeographies()
    if (postBody.analysisSelectionMode === 'SELECTED_AREAS') {
      var geographyIds = []
      postBody.geographies.forEach((geography) => geographyIds.push(geography.id))
      // Note that we are returning a promise that will be resolved when the UI loads all selected regions
      return regions.selectGeographyFromIds(geographyIds)
    } else if (postBody.analysisSelectionMode === 'SELECTED_LOCATIONS') {
      // Immediately resolve and return a promise. Nothing to do when we are in target builder mode
      return $q.when()
    } else {
      throw 'Unexpected selection mode in stateSerializationHelper.js'
    }
  }

  // Load location types from a POST body object that is sent to the optimization engine
  var loadLocationTypesFromBody = (state, postBody) => {
    state.locationTypes.forEach((locationType) => locationType.checked = false)
    postBody.locationTypes.forEach((locationType) => {
      var serviceLocationTypeObj = state.locationTypes.filter((item) => item.key === locationType)[0]
      if (serviceLocationTypeObj) {
        serviceLocationTypeObj.checked = true
      }
    })
  }

  // Load data sources from a POST body object that is sent to the optimization engine
  var loadDataSourcesFromBody = (state, postBody) => {
    state.selectedDataSources = []
    var setOfUploadedDataSources = new Set()
    if (postBody.locationDataSources.business) {
      postBody.locationDataSources.business.forEach((item) => setOfUploadedDataSources.add(item.dataSourceId))
      if (postBody.locationDataSources.business.indexOf(OPTIMIZATION_DATA_SOURCE_GLOBAL) >= 0) {
        var globalBusinessesDataSource = state.defaultDataSources.filter((item) => item.dataSourceId === state.DS_GLOBAL_BUSINESSES)[0]
        state.selectedDataSources.push(globalBusinessesDataSource)
      }
    }
    if (postBody.locationDataSources.household) {
      postBody.locationDataSources.household.forEach((item) => setOfUploadedDataSources.add(item.dataSourceId))
      if (postBody.locationDataSources.household.indexOf(OPTIMIZATION_DATA_SOURCE_GLOBAL) >= 0) {
        var globalHouseholdsDataSource = state.defaultDataSources.filter((item) => item.dataSourceId === state.DS_GLOBAL_HOUSEHOLDS)[0]
        state.selectedDataSources.push(globalHouseholdsDataSource)
      }
    }
    if (postBody.locationDataSources.celltower) {
      postBody.locationDataSources.celltower.forEach((item) => setOfUploadedDataSources.add(item.dataSourceId))
      if (postBody.locationDataSources.celltower.indexOf(OPTIMIZATION_DATA_SOURCE_GLOBAL) >= 0) {
        var globalCellTowerDataSource = state.defaultDataSources.filter((item) => item.dataSourceId === state.DS_GLOBAL_CELLTOWER)[0]
        state.selectedDataSources.push(globalCellTowerDataSource)
      }
    }

    // At this point, the setOfUploadedDataSources will have all data sources selected. Remove the global data source from the list.
    // Note that the "global businesses" data source has id of DS_GLOBAL_BUSINESSES but this is not the same as the global data source.
    // This is because all "global" data sources go in as id 1 to the optimization engine.
    setOfUploadedDataSources.delete(OPTIMIZATION_DATA_SOURCE_GLOBAL)
    // And then add the uploaded data sources to the list
    setOfUploadedDataSources.forEach((uploadedDataSourceId) => {
      var uploadedDataSource = state.allDataSources.filter((item) => item.dataSourceId === uploadedDataSourceId)[0]
      if (uploadedDataSource) {
        state.selectedDataSources.push(uploadedDataSource)
      }
    })
  }

  // Load algorithm parameters from a POST body object that is sent to the optimization engine
  var loadAlgorithmParametersFromBody = (state, optimization, postBody) => {
    // All this "uiSelectedAlgorithm" stuff is because the UI has muliple options that map to (postBody.algorithm === 'IRR')
    state.optimizationOptions.uiAlgorithms.forEach((uiAlgorithm) => {
      if (uiAlgorithm.id === postBody.uiSelectedAlgorithmId) {
        state.optimizationOptions.uiSelectedAlgorithm = uiAlgorithm
      }
    })

    if (postBody.financialConstraints.years) {
      state.optimizationOptions.financialConstraints.years = postBody.financialConstraints.years
    }
    if (postBody.financialConstraints.budget) {
      state.optimizationOptions.financialConstraints.budget = postBody.financialConstraints.budget
    }
    if (postBody.financialConstraints.preIrrThreshold) {
      state.optimizationOptions.financialConstraints.preIrrThreshold = postBody.financialConstraints.preIrrThreshold
    }
    state.optimizationOptions.threshold = postBody.threshold
    if (postBody.analysisSelectionMode === 'SELECTED_AREAS') {
      optimization.setMode('boundaries')
    } else if (postBody.analysisSelectionMode === 'SELECTED_LOCATIONS') {
      optimization.setMode('targets')
    }
  }

  // Load fiber network constraints from a POST body object that is sent to the optimization engine
  var loadFiberNetworkConstraintsFromBody = (state, postBody) => {
    var cellNodeConstraintsObj = state.optimizationOptions.fiberNetworkConstraints.cellNodeConstraints
    cellNodeConstraintsObj.cellRadius = postBody.fiberNetworkConstraints.cellNodeConstraints.cellRadius
    cellNodeConstraintsObj.polygonStrategy = postBody.fiberNetworkConstraints.cellNodeConstraints.polygonStrategy
    var selectedTile = cellNodeConstraintsObj.tiles.filter((item) => item.id === postBody.fiberNetworkConstraints.cellNodeConstraints.tileSystemId)
    if (selectedTile.length === 1) {
      cellNodeConstraintsObj.selectedTile = selectedTile[0]
    }
  }

  // Load technologies from a POST body object that is sent to the optimization engine
  var loadTechnologiesFromBody = (state, postBody) => {
    state.optimizationOptions.technologies.forEach((technology) => technology.checked = false)
    postBody.networkTypes.forEach((networkType) => {
      var matchedTechnology = state.optimizationOptions.technologies.filter((technology) => technology.id.toUpperCase() === networkType.toUpperCase())
      if (matchedTechnology && matchedTechnology.length === 1) {
        matchedTechnology[0].checked = true
      }
    })
  }

  // ------------------------------------------------------------------------------------------------------------------
  // End section - POST body to state
  // ------------------------------------------------------------------------------------------------------------------

  return stateSerializationHelper
}])
