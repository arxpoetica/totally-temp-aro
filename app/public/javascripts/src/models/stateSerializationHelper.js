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
    optimizationBody.optimization = {}
    optimizationBody.analysis_type = 'NETWORK_PLAN'

    addLocationTypesToBody(state, optimization, optimizationBody)
    addConstructionSitesToBody(state,optimizationBody)
    addAlgorithmParametersToBody(state, optimizationBody)
    addFiberNetworkConstraintsToBody(state, optimizationBody)
    optimizationBody.generatedDataRequest = state.optimizationOptions.generatedDataRequest

    return optimizationBody
  }

  // Add location types to a POST body that we will send to aro-service for performing optimization
  var addLocationTypesToBody = (state, optimization, postBody) => {

    var setOfSelectedDataSources = new Set()  // All global data sources have id "1"
    state.selectedDataSources.forEach((selectedDataSource) => {
      var libraryId = selectedDataSource.libraryId
      if (libraryId === state.DS_GLOBAL_BUSINESSES || libraryId === state.DS_GLOBAL_HOUSEHOLDS || libraryId === state.DS_GLOBAL_CELLTOWER) {
        libraryId = 1  // All global data sources have ID 1
      }
      setOfSelectedDataSources.add(libraryId)
    })
    var libraryItems = []
    setOfSelectedDataSources.forEach((libraryId) => libraryItems.push({ identifier: libraryId }))
    postBody.overridenConfiguration = [{
      dataType: 'location',
      libraryItems: libraryItems
    }]

    var selectedLocationTypes = state.locationTypes.getValue().filter((item) => item.checked)
    postBody.locationConstraints = {
      locationTypes: _.pluck(selectedLocationTypes, 'plannerKey'),
      analysisSelectionMode: (optimization.getMode() === 'boundaries') ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
    }
  }

  //Add construction sites to a POST body that we will send to aro-service for performing optimization its either locations or construction sites
  var addConstructionSitesToBody = (state, postBody) => {
    // To be fixed correctly when we implement construction sites
    // var selectedConstructionSites = state.constructionSites.filter((item) => item.checked)
    // postBody.locationTypes = _.pluck(selectedConstructionSites, 'key')
  }

  // Add algorithm parameters to a POST body that we will send to aro-service for performing optimization
  var addAlgorithmParametersToBody = (state, postBody) => {
    // All this "uiSelectedAlgorithm" stuff is because the UI has muliple options that map to (postBody.algorithm === 'IRR')
    postBody.optimization = {
      algorithmType: 'DEFAULT',
      algorithm: state.optimizationOptions.uiSelectedAlgorithm.algorithm,
      uiSelectedAlgorithmId: state.optimizationOptions.uiSelectedAlgorithm.id,
      threshold: state.optimizationOptions.threshold,
      preIrrThreshold: null,
      budget: 'Infinity'
    }
    if (state.optimizationOptions.uiSelectedAlgorithm.algorithm === 'TABC') {
      var generations = state.optimizationOptions.routeGenerationOptions.filter((item) => item.checked)
      postBody.customOptimization = {
        name: 'TABC',
        map: { generations: generations.join(',') }
      }
    }

    postBody.financialConstraints = JSON.parse(JSON.stringify(state.optimizationOptions.financialConstraints))  // Quick deep copy
  }
  
  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (state, postBody) => {
    postBody.networkConstraints = {}
    postBody.networkConstraints.routingMode = state.optimizationOptions.networkConstraints.routingMode

    var fiveGEnabled = false
    state.optimizationOptions.technologies.forEach((technology) => {
      if (technology.id === 'FiveG' && technology.checked) {
        fiveGEnabled = true
      }
    })
    if (fiveGEnabled) {
      postBody.networkConstraints.cellNodeConstraints = {}
      postBody.networkConstraints.cellNodeConstraints.cellRadius = state.optimizationOptions.networkConstraints.cellNodeConstraints.cellRadius
      postBody.networkConstraints.cellNodeConstraints.polygonStrategy = state.optimizationOptions.networkConstraints.cellNodeConstraints.polygonStrategy
      postBody.networkConstraints.cellNodeConstraints.cellGranularityRatio = 0.5
      postBody.networkConstraints.cellNodeConstraints.minimumRayLength = 45
      var selectedTile = state.optimizationOptions.networkConstraints.cellNodeConstraints.selectedTile
      if (selectedTile) {
        postBody.networkConstraints.cellNodeConstraints.tileSystemId = selectedTile.id
      }
    }

    // Add technologies like "Fiber" and "5G"
    postBody.networkConstraints.networkTypes = []
    state.optimizationOptions.technologies.forEach((technology) => {
      if (technology.checked) {
        postBody.networkConstraints.networkTypes.push(technology.id)
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
    loadAlgorithmParametersFromBody(state, optimization, postBody)
    loadFiberNetworkConstraintsFromBody(state, postBody)
    loadTechnologiesFromBody(state, postBody)

    // Select geographies
    regions.removeAllGeographies()
    if (postBody.locationConstraints.analysisSelectionMode === 'SELECTED_AREAS') {
      var geographyIds = []
      postBody.geographies.forEach((geography) => geographyIds.push(geography.id))
      // Note that we are returning a promise that will be resolved when the UI loads all selected regions
      return regions.selectGeographyFromIds(geographyIds)
    } else if (postBody.locationConstraints.analysisSelectionMode === 'SELECTED_LOCATIONS') {
      // Immediately resolve and return a promise. Nothing to do when we are in target builder mode
      return $q.when()
    } else {
      throw 'Unexpected selection mode in stateSerializationHelper.js'
    }
  }

  // Load location types from a POST body object that is sent to the optimization engine
  var loadLocationTypesFromBody = (state, postBody) => {
    var newLocationTypes = angular.copy(state.locationTypes.getValue())
    newLocationTypes.forEach((locationType) => locationType.checked = false)
    postBody.locationConstraints.locationTypes.forEach((locationType) => {
      var serviceLocationTypeObj = newLocationTypes.filter((item) => item.plannerKey === locationType)[0]
      if (serviceLocationTypeObj) {
        serviceLocationTypeObj.checked = true
      }
    })
    state.locationTypes.next(newLocationTypes)
  }

  // Load algorithm parameters from a POST body object that is sent to the optimization engine
  var loadAlgorithmParametersFromBody = (state, optimization, postBody) => {
    // All this "uiSelectedAlgorithm" stuff is because the UI has muliple options that map to (postBody.algorithm === 'IRR')
    state.optimizationOptions.uiAlgorithms.forEach((uiAlgorithm) => {
      if (uiAlgorithm.id === postBody.uiSelectedAlgorithmId) {
        state.optimizationOptions.uiSelectedAlgorithm = uiAlgorithm
      }
    })

    if (postBody.financialConstraints) {
      state.optimizationOptions.financialConstraints = JSON.parse(JSON.stringify(postBody.financialConstraints))
    }
    if (postBody.threshold) {
      state.optimizationOptions.threshold = postBody.optimization.threshold
    }
    if (postBody.locationConstraints.analysisSelectionMode === 'SELECTED_AREAS') {
      optimization.setMode('boundaries')
    } else if (postBody.locationConstraints.analysisSelectionMode === 'SELECTED_LOCATIONS') {
      optimization.setMode('targets')
    }
  }

  // Load fiber network constraints from a POST body object that is sent to the optimization engine
  var loadFiberNetworkConstraintsFromBody = (state, postBody) => {
    if (postBody.networkConstraints
        && postBody.networkConstraints.cellNodeConstraints) {
      var cellNodeConstraintsObj = state.optimizationOptions.networkConstraints.cellNodeConstraints
      if (postBody.networkConstraints.cellNodeConstraints.cellRadius) {
        cellNodeConstraintsObj.cellRadius = postBody.networkConstraints.cellNodeConstraints.cellRadius
      }
      if (postBody.networkConstraints.cellNodeConstraints.polygonStrategy) {
        cellNodeConstraintsObj.polygonStrategy = postBody.networkConstraints.cellNodeConstraints.polygonStrategy
      }
      if (postBody.networkConstraints.cellNodeConstraints.tileSystemId) {
        var selectedTile = cellNodeConstraintsObj.tiles.filter((item) => item.id === postBody.networkConstraints.cellNodeConstraints.tileSystemId)
        if (selectedTile.length === 1) {
          cellNodeConstraintsObj.selectedTile = selectedTile[0]
        }
      }
    }
  }

  // Load technologies from a POST body object that is sent to the optimization engine
  var loadTechnologiesFromBody = (state, postBody) => {
    state.optimizationOptions.technologies.forEach((technology) => technology.checked = false)
    postBody.networkConstraints.networkTypes.forEach((networkType) => {
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
