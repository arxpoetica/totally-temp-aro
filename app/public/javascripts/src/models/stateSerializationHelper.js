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

    var optimizationBody = {
      planId: state.plan.getValue().id,
      analysis_type: 'NETWORK_PLAN'
    }

    addLocationTypesToBody(state, optimization, optimizationBody)
    addConstructionSitesToBody(state,optimizationBody)
    addAlgorithmParametersToBody(state, optimizationBody)
    addFiberNetworkConstraintsToBody(state, optimizationBody)
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

    var setOfSelectedDataSources = new Set()  // All global data sources have id "1"
    var businessesSelected = state.hasLocationType('business')  // This will cover small, medium, large
    var householdsSelected = state.hasLocationType('household')
    var celltowersSelected = state.hasLocationType('celltower')

    // All global data source ids are 1. But only add it if the correct combination is selected (for
    // example, businesses + global business datasources = valid combination)
    state.selectedDataSources.forEach((selectedDataSource) => {
      var libraryId = selectedDataSource.libraryId
      if (libraryId === state.DS_GLOBAL_BUSINESSES) {
        libraryId = businessesSelected ? 1 : null
      } else if (libraryId === state.DS_GLOBAL_HOUSEHOLDS) {
        libraryId = householdsSelected ? 1 : null
      } else if (libraryId === state.DS_GLOBAL_CELLTOWER) {
        libraryId = celltowersSelected ? 1 : null
      }
      if (libraryId) {
        setOfSelectedDataSources.add(libraryId)
      }
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
      preIrrThreshold: state.optimizationOptions.preIrrThreshold,
      budget: state.optimizationOptions.budget
    }
    if (state.optimizationOptions.uiSelectedAlgorithm.algorithm === 'TABC') {
      var generations = state.optimizationOptions.routeGenerationOptions.filter((item) => item.checked)
      postBody.customOptimization = {
        name: 'TABC',
        map: { generations: generations.join(',') }
      }
    }

    // Delete items from postBody.optimization based on the type of algorithm we are using.
    var algorithmId = state.optimizationOptions.uiSelectedAlgorithm.id
    if (algorithmId === 'UNCONSTRAINED' || algorithmId === 'MAX_IRR') {
      delete postBody.optimization.budget
      delete postBody.optimization.preIrrThreshold
      delete postBody.optimization.threshold
    } else if (algorithmId === 'COVERAGE') {
      delete postBody.optimization.budget
      delete postBody.optimization.preIrrThreshold
    } else if (algorithmId === 'BUDGET') {
      delete postBody.optimization.preIrrThreshold
      delete postBody.optimization.threshold
    } else if (algorithmId === 'IRR_TARGET') {
      delete postBody.optimization.preIrrThreshold
    } else if (algorithmId === 'IRR_THRESH') {
      delete postBody.optimization.budget
      delete postBody.optimization.threshold
    }

    postBody.financialConstraints = JSON.parse(JSON.stringify(state.optimizationOptions.financialConstraints))  // Quick deep copy
  }
  
  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (state, postBody) => {
    postBody.networkConstraints = {}
    postBody.networkConstraints.routingMode = state.optimizationOptions.networkConstraints.routingMode

    var fiveGEnabled = false
    state.optimizationOptions.selectedTechnology.forEach((technology) => {
      if (technology.id === 'FiveG') {
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
    state.optimizationOptions.selectedTechnology.forEach((technology) => {
      postBody.networkConstraints.networkTypes.push(technology.id)
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

    // Load the selected data sources
    var dataSourceIdsToSelect = []
    var businessesSelected = state.hasLocationType('business')  // This will cover small, medium, large
    var householdsSelected = state.hasLocationType('household')
    var celltowersSelected = state.hasLocationType('celltower')
    if (postBody.overridenConfiguration) {
      postBody.overridenConfiguration.forEach((overridenConfiguration) => {
        if (overridenConfiguration.dataType === 'location') {
          // This is a location configuration. Loop through the library ids
          overridenConfiguration.libraryItems.forEach((libraryItem) => {
            var dataSourceId = libraryItem.identifier
            if (dataSourceId === 1 && businessesSelected) {
              dataSourceIdsToSelect.push(state.DS_GLOBAL_BUSINESSES)
            } else if (dataSourceId === 1 && householdsSelected) {
              dataSourceIdsToSelect.push(state.DS_GLOBAL_HOUSEHOLDS)
            } else if (dataSourceId === 1 && celltowersSelected) {
              dataSourceIdsToSelect.push(state.DS_GLOBAL_CELLTOWER)
            } else {
              dataSourceIdsToSelect.push(dataSourceId)
            }
          })
        }
      })
    }
    // Select data source ids from the list of all data sources
    var mapDataSourceIdToObj = {}
    state.allDataSources.forEach((dataSource) => mapDataSourceIdToObj[dataSource.libraryId] = dataSource)
    state.selectedDataSources = []
    dataSourceIdsToSelect.forEach((dataSourceId) => state.selectedDataSources.push(mapDataSourceIdToObj[dataSourceId]))
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
      state.optimizationOptions.threshold = +postBody.optimization.threshold
    }
    if (postBody.preIrrThreshold) {
      state.optimizationOptions.preIrrThreshold = +postBody.optimization.preIrrThreshold
    }
    if (postBody.budget) {
      state.optimizationOptions.budget = +postBody.optimization.budget
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
      state.optimizationOptions.selectedTechnology = matchedTechnology  // Technically this will be overwritten if we have multiple technologies. Let it be for now.
    })
  }

  // ------------------------------------------------------------------------------------------------------------------
  // End section - POST body to state
  // ------------------------------------------------------------------------------------------------------------------

  return stateSerializationHelper
}])
