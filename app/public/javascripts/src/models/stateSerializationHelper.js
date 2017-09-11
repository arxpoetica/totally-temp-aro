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
    addRegionsToBody(state, optimization, regions, optimizationBody)
    addFiberNetworkConstraintsToBody(state, optimizationBody)
    optimizationBody.fiberSourceIds = []
    state.selectedExistingFibers.forEach((selectedExistingFiber) => optimizationBody.fiberSourceIds.push(selectedExistingFiber.systemId))
    optimizationBody.generatedDataRequest = state.optimizationOptions.generatedDataRequest

    addNetworkAnalysisType(state, optimizationBody)    

    return optimizationBody
  }

  // Add Network Analysis types to a POST body that we will send to aro-service for performing optimization its either network plan or network analysis or coverage
  var addNetworkAnalysisType = (state, postBody) => {
    postBody.analysis_type = state.networkAnalysisType.type

    if (postBody.analysis_type === 'NETWORK_ANALYSIS') {
      delete postBody.fronthaulOptimization
      delete postBody.generatedDataRequest
    }
  }

  // Add location types to a POST body that we will send to aro-service for performing optimization
  var addLocationTypesToBody = (state, optimization, postBody) => {
    var selectedLocationTypes = state.locationTypes.getValue().filter((item) => item.checked)
    postBody.locationConstraints = {
      locationTypes: _.pluck(selectedLocationTypes, 'plannerKey'),
      analysisSelectionMode: (state.optimizationOptions.selectedgeographicalLayer.id === 'SELECTED_AREAS') ? 'SELECTED_AREAS' : 'SELECTED_LOCATIONS'
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

  // Add regions to a POST body that we will send to aro-service for performing optimization
  var addRegionsToBody = (state, optimization, regions, postBody) => {
    var standardTypes = ['cma_boundaries', 'census_blocks', 'county_subdivisions', 'user_defined', 'wirecenter', 'cran', 'directional_facility']
    var setOfProcessLayers = new Set()
    regions.selectedRegions.map((i) => {
      var info = { name: i.name, id: i.id, type: i.type, layerId: i.layerId }
      // geography information may be too large so we avoid to send it for known region types
      if (standardTypes.indexOf(i.type) === -1) {
        info.geog = i.geog
      }
      if (i.layerId) {
        setOfProcessLayers.add(+i.layerId)
      }
      return info
    })
    // Temporarily setting postBody.processLayers to []. As of now, aro-service does not create routes when
    // you send a process layer into it. Will send process layer ids after we figure out what is happening in service.
    //postBody.processLayers = [] // Array.from(setOfProcessLayers)
    postBody.processLayers = state.optimizationOptions.processLayers
    if (state.optimizationOptions.selectedLayer) {
      postBody.processLayers = [state.optimizationOptions.selectedLayer.id]
    }
  }
  
  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (state, postBody) => {
    postBody.networkConstraints = {}
    postBody.networkConstraints.routingMode = state.optimizationOptions.networkConstraints.routingMode
    postBody.networkConstraints.fiberRoutingMode = 'ROUTE_FROM_NODES'

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

    state.loadExistingFibersList()
      .then(() => {
        // The state will have a list of all fiber source ids
        state.allExistingFibers.forEach((existingFiber) => {
          if (postBody.fiberSourceIds.indexOf(existingFiber.systemId) >= 0) {
            state.selectedExistingFibers.push(existingFiber)
          }
        })
      })

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
