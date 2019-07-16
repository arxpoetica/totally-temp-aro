/**
 * When we perform optimization, we send a POST request to aro-service with the optimization parameters as a POST body.
 * This service helps us to convert the "state" object to and from this POST body.
 * Services like "state" and "region" are intentionally not injected into this, instead we send them in as parameters.
 */
app.service('stateSerializationHelper', ['$q', ($q) => {
  var stateSerializationHelper = {}

  // ------------------------------------------------------------------------------------------------------------------
  // Begin section - state to POST body
  // ------------------------------------------------------------------------------------------------------------------

  // Get a POST body that we will send to aro-service for performing optimization
  stateSerializationHelper.getOptimizationBody = (state, reduxState) => {
    var optimizationBody = {
      planId: state.plan.id,
      projectTemplateId: state.loggedInUser.projectId,
      analysis_type: 'NETWORK_PLAN'
    }

    addLocationTypesToBody(state, reduxState, optimizationBody)
    addDataSelectionsToBody(state, reduxState.plan.dataItems, optimizationBody)
    addAlgorithmParametersToBody(state, optimizationBody)
    addFiberNetworkConstraintsToBody(state, optimizationBody)
    optimizationBody.generatedDataRequest = state.optimizationOptions.generatedDataRequest
    optimizationBody.fronthaulOptimization = state.optimizationOptions.fronthaulOptimization

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
  var addLocationTypesToBody = (state, reduxState, postBody) => {
    var selectedLocationLayers = state.locationLayers.filter((item) => item.checked)
    postBody.locationConstraints = {
      locationTypes: _.pluck(selectedLocationLayers, 'plannerKey'),
      analysisSelectionMode: reduxState.selection.activeSelectionMode.id
    }
    if (reduxState.selection.activeSelectionMode.id === 'SELECTED_ANALYSIS_AREAS') {
      // If we have analysis areas selected, we can have exactly one analysis layer selected in the UI
      const visibleAnalysisLayers = state.getVisibleAnalysisLayers()
      if (visibleAnalysisLayers.size !== 1) {
        const errorMessage = 'You must have exactly one analysis layer selected to perform this analysis'
        swal({
          title: 'Analysis Layer error',
          text: errorMessage,
          type: 'error',
          closeOnConfirm: true
        })
        throw errorMessage
      }
      postBody.locationConstraints.analysisLayerId = visibleAnalysisLayers.get(0).analysisLayerId
    }
  }

  // Add selected plan settings -> Data Selection to a POST body that we will send to aro-service for performing optimization
  var addDataSelectionsToBody = (state, dataItems, postBody) => {
    if (!postBody.overridenConfiguration) {
      postBody.overridenConfiguration = []
    }

    Object.keys(dataItems).forEach((dataItemKey) => {
      var dataItem = dataItems[dataItemKey]
      var libraryItems = []
      dataItem.selectedLibraryItems.forEach((selectedLibraryItem) => libraryItems.push({ identifier: selectedLibraryItem.identifier }))
      postBody.overridenConfiguration.push({
        dataType: dataItemKey,
        libraryItems: libraryItems
      })
    })
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
      budget: state.optimizationOptions.budget * 1000
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

    postBody.financialConstraints = JSON.parse(JSON.stringify(state.optimizationOptions.financialConstraints)) // Quick deep copy
    postBody.competitionConfiguration = JSON.parse(JSON.stringify(state.optimizationOptions.competitionConfiguration)) // Quick deep copy
  }

  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (state, postBody) => {
    postBody.networkConstraints = {}
    postBody.networkConstraints.routingMode = state.optimizationOptions.networkConstraints.routingMode
    postBody.networkConstraints.advancedAnalysis = state.optimizationOptions.networkConstraints.advancedAnalysis

    var fiveGEnabled = state.optimizationOptions.technologies.FiveG.checked
    if (fiveGEnabled || state.optimizationOptions.networkConstraints.advancedAnalysis) {
      postBody.networkConstraints.cellNodeConstraints = {}
      postBody.networkConstraints.cellNodeConstraints.polygonStrategy = state.optimizationOptions.networkConstraints.cellNodeConstraints.polygonStrategy
      // Cell radius should be added only for fixed radius
      if (state.optimizationOptions.networkConstraints.cellNodeConstraints.polygonStrategy === 'FIXED_RADIUS') {
        postBody.networkConstraints.cellNodeConstraints.cellRadius = state.optimizationOptions.networkConstraints.cellNodeConstraints.cellRadius
      }
      postBody.networkConstraints.cellNodeConstraints.cellGranularityRatio = state.optimizationOptions.networkConstraints.cellNodeConstraints.cellGranularityRatio
      postBody.networkConstraints.cellNodeConstraints.minimumRayLength = state.optimizationOptions.networkConstraints.cellNodeConstraints.minimumRayLength
      var selectedTile = state.optimizationOptions.networkConstraints.cellNodeConstraints.selectedTile
      if (selectedTile) {
        postBody.networkConstraints.cellNodeConstraints.tileSystemId = selectedTile.id
      }
    }

    // If Copper is enabled, add dslamNodeConstraints
    if (state.optimizationOptions.technologies.Copper.checked) {
      postBody.networkConstraints.dslamNodeConstraints = state.optimizationOptions.networkConstraints.dslamNodeConstraints
    }

    // Add technologies like "Fiber" and "5G"
    postBody.networkConstraints.networkTypes = []
    Object.keys(state.optimizationOptions.technologies).forEach((technologyKey) => {
      var technology = state.optimizationOptions.technologies[technologyKey]
      if (technology.checked) {
        postBody.networkConstraints.networkTypes.push(technologyKey)
      }
    })

    // Add Route from Existing Fiber
    if (state.optimizationOptions.networkConstraints.routeFromFiber) {
      postBody.networkConstraints.fiberRoutingMode = state.fiberRoutingModes.ROUTE_FROM_FIBER
    }
  }

  // ------------------------------------------------------------------------------------------------------------------
  // End section - state to POST body
  // ------------------------------------------------------------------------------------------------------------------

  // ------------------------------------------------------------------------------------------------------------------
  // Begin section - POST body to state
  // ------------------------------------------------------------------------------------------------------------------

  // Load optimization options from a JSON string
  stateSerializationHelper.loadStateFromJSON = (state, reduxState, dispatchers, planInputs) => {
    loadAnalysisTypeFromBody(state, planInputs)
    loadLocationTypesFromBody(state, reduxState, dispatchers, planInputs)
    loadSelectedExistingFiberFromBody(state, reduxState, dispatchers, planInputs)
    loadAlgorithmParametersFromBody(state, dispatchers, planInputs)
    loadFiberNetworkConstraintsFromBody(state, planInputs)
    loadTechnologiesFromBody(state, planInputs)
  }

  // Load analysis type from a POST body object that is sent to the optimization engine
  var loadAnalysisTypeFromBody = (state, planInputs) => {
    state.networkAnalysisTypes.forEach((analysisType) => {
      if (analysisType.id === planInputs.analysis_type) {
        state.networkAnalysisType = analysisType
        //console.log(analysisType)
      }
    })
  }

  // Load location types from a POST body object that is sent to the optimization engine
  var loadLocationTypesFromBody = (state, dataItems, dispatchers, postBody) => {
    state.locationLayers.forEach((locationLayer) => {
      const isVisible = (postBody.locationConstraints.locationTypes.indexOf(locationLayer.plannerKey) >= 0)
      state.setLayerVisibility(locationLayer, isVisible)
    })

    // Load the selected data sources
    var libraryIdsToSelect = []
    if (postBody.overridenConfiguration) {
      postBody.overridenConfiguration.forEach((overridenConfiguration) => {
        if (overridenConfiguration.dataType === 'location') {
          // This is a location configuration. Loop through the library ids
          overridenConfiguration.libraryItems.forEach((libraryItem) => libraryIdsToSelect.push(libraryItem.identifier))
        }
      })
    }
    // Select data source ids from the list of all data sources
    var mapLibraryIdToLibrary = {}
    if (dataItems && dataItems.location) {
      dataItems.location.allLibraryItems.forEach((libraryItem) => {
        mapLibraryIdToLibrary[libraryItem.identifier] = libraryItem
      })
      var selectedLibraryItems = []
      libraryIdsToSelect.forEach((libraryId) => selectedLibraryItems.push(mapLibraryIdToLibrary[libraryId]))
      dispatchers.selectDataItems('location', selectedLibraryItems)
    }
  }

  // Load the selected existing fiber from a POST body object that is sent to the optimization engine
  var loadSelectedExistingFiberFromBody = (state, dataItems, dispatchers, postBody) => {
    if (!dataItems.fiber) {
      return
    }
    if (postBody.overridenConfiguration) {
      var selectedLibraryItems = []
      postBody.overridenConfiguration.forEach((overridenConfiguration) => {
        if (overridenConfiguration.dataType === 'fiber') {
          overridenConfiguration.libraryItems.forEach((libraryItem) => {
            var matchingFibers = dataItems.fiber.allLibraryItems.filter((item) => item.identifier === libraryItem.identifier)
            if (matchingFibers.length === 1) {
              selectedLibraryItems.push(matchingFibers[0])
            }
          })
        }
      })
      dispatchers.selectDataItems('fiber', selectedLibraryItems)
    }
  }

  // Load algorithm parameters from a POST body object that is sent to the optimization engine
  var loadAlgorithmParametersFromBody = (state, dispatchers, postBody) => {
    if (!postBody.optimization) {
      console.warn('No optimization in postBody. This can happen when we have manually edited plans.')
      return
    }

    if (postBody.optimization.algorithm === 'UNCONSTRAINED') {
      state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.UNCONSTRAINED
    } else if (postBody.optimization.algorithm === 'COVERAGE') {
      state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.COVERAGE
    } else {
      if (postBody.optimization.algorithm === 'IRR') {
        if (!postBody.optimization.preIrrThreshold && !postBody.optimization.threshold &&
          !Number.isFinite(+postBody.optimization.budget)) { state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.MAX_IRR } else if (!postBody.optimization.preIrrThreshold && !postBody.optimization.threshold) { state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.BUDGET } else if (!postBody.optimization.preIrrThreshold) { state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.IRR_TARGET } else { state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.IRR_THRESH }
      }
    }

    if (postBody.financialConstraints) {
      state.optimizationOptions.financialConstraints = JSON.parse(JSON.stringify(postBody.financialConstraints))
    }
    if (postBody.competitionConfiguration) {
      state.optimizationOptions.competitionConfiguration = JSON.parse(JSON.stringify(postBody.competitionConfiguration))
    }
    if (postBody.optimization.threshold) {
      state.optimizationOptions.threshold = +postBody.optimization.threshold
    }
    if (postBody.optimization.preIrrThreshold) {
      state.optimizationOptions.preIrrThreshold = +postBody.optimization.preIrrThreshold
    }
    if (postBody.optimization.budget && Number.isFinite(+postBody.optimization.budget)) {
      state.optimizationOptions.budget = +postBody.optimization.budget / 1000
    }
    dispatchers.setSelectionTypeById(postBody.locationConstraints.analysisSelectionMode)
    if (postBody.locationConstraints.analysisSelectionMode === 'SELECTED_ANALYSIS_AREAS') {
      state.setLayerVisibilityByKey('analysisLayerId', postBody.locationConstraints.analysisLayerId, true)
    }
  }

  // Load fiber network constraints from a POST body object that is sent to the optimization engine
  var loadFiberNetworkConstraintsFromBody = (state, postBody) => {
    if (postBody.networkConstraints && postBody.networkConstraints.routingMode) {
      state.optimizationOptions.networkConstraints.routingMode = postBody.networkConstraints.routingMode
    }

    if (postBody.networkConstraints &&
        postBody.networkConstraints.cellNodeConstraints) {
      var cellNodeConstraintsObj = state.optimizationOptions.networkConstraints.cellNodeConstraints
      if (postBody.networkConstraints.cellNodeConstraints.cellRadius) {
        cellNodeConstraintsObj.cellRadius = postBody.networkConstraints.cellNodeConstraints.cellRadius
      }
      if (postBody.networkConstraints.cellNodeConstraints.polygonStrategy) {
        cellNodeConstraintsObj.polygonStrategy = postBody.networkConstraints.cellNodeConstraints.polygonStrategy
      }
      if (postBody.networkConstraints.cellNodeConstraints.cellGranularityRatio) {
        cellNodeConstraintsObj.cellGranularityRatio = postBody.networkConstraints.cellNodeConstraints.cellGranularityRatio
      }
      if (postBody.networkConstraints.cellNodeConstraints.minimumRayLength) {
        cellNodeConstraintsObj.minimumRayLength = postBody.networkConstraints.cellNodeConstraints.minimumRayLength
      }
      if (postBody.networkConstraints.cellNodeConstraints.tileSystemId) {
        var selectedTile = cellNodeConstraintsObj.tiles.filter((item) => item.id === postBody.networkConstraints.cellNodeConstraints.tileSystemId)
        if (selectedTile.length === 1) {
          cellNodeConstraintsObj.selectedTile = selectedTile[0]
        }
      }
    }

    if (postBody.networkConstraints &&
        postBody.networkConstraints.dslamNodeConstraints) {
      state.optimizationOptions.networkConstraints.dslamNodeConstraints = postBody.networkConstraints.dslamNodeConstraints
    }

    if (postBody.networkConstraints && postBody.networkConstraints.fiberRoutingMode &&
      postBody.networkConstraints.fiberRoutingMode == state.fiberRoutingModes.ROUTE_FROM_FIBER) {
      state.optimizationOptions.networkConstraints.routeFromFiber = true
    }
  }

  // Load technologies from a POST body object that is sent to the optimization engine
  var loadTechnologiesFromBody = (state, postBody) => {
    state.optimizationOptions.networkConstraints.advancedAnalysis = postBody.networkConstraints.advancedAnalysis
    Object.keys(state.optimizationOptions.technologies).forEach((technologyKey) => state.optimizationOptions.technologies[technologyKey].checked = false)
    postBody.networkConstraints.networkTypes.forEach((networkType) => {
      var matchedTechnology = Object.keys(state.optimizationOptions.technologies).filter((technologyKey) => technologyKey.toUpperCase() === networkType.toUpperCase())[0]
      state.optimizationOptions.technologies[matchedTechnology].checked = true
    })
  }

  // ------------------------------------------------------------------------------------------------------------------
  // End section - POST body to state
  // ------------------------------------------------------------------------------------------------------------------

  return stateSerializationHelper
}])
