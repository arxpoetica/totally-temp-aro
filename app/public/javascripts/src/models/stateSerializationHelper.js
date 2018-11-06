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
  stateSerializationHelper.getOptimizationBody = (state, optimization) => {

    var optimizationBody = {
      planId: state.plan.getValue().id,
      projectTemplateId: state.loggedInUser.projectId,
      analysis_type: 'NETWORK_PLAN'
    }

    addLocationTypesToBody(state, optimization, optimizationBody)
    addDataSelectionsToBody(state,optimizationBody)
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
    var selectedLocationTypes = state.locationTypes.getValue().filter((item) => item.checked)
    postBody.locationConstraints = {
      locationTypes: _.pluck(selectedLocationTypes, 'plannerKey'),
      analysisSelectionMode: state.optimizationOptions.analysisSelectionMode
    }
    if (state.optimizationOptions.analysisSelectionMode === state.selectionModes.SELECTED_ANALYSIS_AREAS) {
      // If we have analysis areas selected, we can have exactly one analysis layer selected in the UI
      const visibleAnalysisLayers = state.boundaries.tileLayers.filter(item => item.visible && (item.type === 'analysis_layer'))
      if (visibleAnalysisLayers.length !== 1) {
        const errorMessage = 'You must have exactly one analysis layer selected to perform this analysis'
        swal({
          title: 'Analysis Layer error',
          text: errorMessage,
          type: 'error',
          closeOnConfirm: true
        })
        throw errorMessage
      }
      postBody.locationConstraints.analysisLayerId = visibleAnalysisLayers[0].analysisLayerId
    }
  }

  // Add selected plan settings -> Data Selection to a POST body that we will send to aro-service for performing optimization
  var addDataSelectionsToBody = (state, postBody) => {
    if (!postBody.overridenConfiguration) {
      postBody.overridenConfiguration = []
    }

    Object.keys(state.dataItems).forEach((dataItemKey) => {
      var dataItem = state.dataItems[dataItemKey]
      var libraryItems = []
      dataItem.selectedLibraryItems.forEach((selectedLibraryItem) => libraryItems.push({ identifier: selectedLibraryItem.identifier }))
      postBody.overridenConfiguration.push({
        dataType: dataItemKey,
        libraryItems: libraryItems
      })
    })
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
      threshold: state.optimizationOptions.threshold / 100,
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

    postBody.financialConstraints = JSON.parse(JSON.stringify(state.optimizationOptions.financialConstraints))  // Quick deep copy
  }
  
  // Add fiber network constraints to a POST body that we will send to aro-service for optimization
  var addFiberNetworkConstraintsToBody = (state, postBody) => {
    postBody.networkConstraints = {}
    postBody.networkConstraints.routingMode = state.optimizationOptions.networkConstraints.routingMode

    var fiveGEnabled = state.optimizationOptions.technologies.FiveG.checked
    if (fiveGEnabled) {
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

    // Add technologies like "Fiber" and "5G"
    postBody.networkConstraints.networkTypes = []
    Object.keys(state.optimizationOptions.technologies).forEach((technologyKey) => {
      var technology = state.optimizationOptions.technologies[technologyKey]
      if (technology.checked) {
        postBody.networkConstraints.networkTypes.push(technologyKey)
      }
    })

    // Add Route from Existing Fiber
    if(state.optimizationOptions.networkConstraints.routeFromFiber) {
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
  stateSerializationHelper.loadStateFromJSON = (state, optimization, planInputs) => {
    loadAnalysisTypeFromBody(state, planInputs)
    loadLocationTypesFromBody(state, planInputs)
    loadSelectedExistingFiberFromBody(state, planInputs)
    loadAlgorithmParametersFromBody(state, optimization, planInputs)
    loadFiberNetworkConstraintsFromBody(state, planInputs)
    loadTechnologiesFromBody(state, planInputs)
  }

  // Load analysis type from a POST body object that is sent to the optimization engine
  var loadAnalysisTypeFromBody = (state, planInputs) => {
    state.networkAnalysisTypes.forEach((analysisType) => {
      if (analysisType.id === planInputs.analysis_type) {
        state.networkAnalysisType = analysisType
      }
    })
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
    if (state.dataItems && state.dataItems.location) {
      state.dataItems.location.allLibraryItems.forEach((libraryItem) => {
        mapLibraryIdToLibrary[libraryItem.identifier] = libraryItem
      })
      state.dataItems.location.selectedLibraryItems = []
      libraryIdsToSelect.forEach((libraryId) => state.dataItems.location.selectedLibraryItems.push(mapLibraryIdToLibrary[libraryId]))
    }
  }

  // Load the selected existing fiber from a POST body object that is sent to the optimization engine
  var loadSelectedExistingFiberFromBody = (state, postBody) => {
    if (!state.dataItems.fiber) {
      return
    }
    state.dataItems.fiber.selectedLibraryItems = []
    if (postBody.overridenConfiguration) {
      postBody.overridenConfiguration.forEach((overridenConfiguration) => {
        if (overridenConfiguration.dataType === 'fiber') {
          overridenConfiguration.libraryItems.forEach((libraryItem) => {
            var matchingFibers = state.dataItems.fiber.allLibraryItems.filter((item) => item.identifier === libraryItem.identifier)
            if (matchingFibers.length === 1) {
              state.dataItems.fiber.selectedLibraryItems.push(matchingFibers[0])
            }
          })
        }
      })
    }
  }

  // Load algorithm parameters from a POST body object that is sent to the optimization engine
  var loadAlgorithmParametersFromBody = (state, optimization, postBody) => {

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
          !Number.isFinite(+postBody.optimization.budget))
          state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.MAX_IRR
        else if ( !postBody.optimization.preIrrThreshold && !postBody.optimization.threshold )
          state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.BUDGET  
        else if (!postBody.optimization.preIrrThreshold)
          state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.IRR_TARGET
        else
          state.optimizationOptions.uiSelectedAlgorithm = state.OPTIMIZATION_TYPES.IRR_THRESH  
      }
    }

    if (postBody.financialConstraints) {
      state.optimizationOptions.financialConstraints = JSON.parse(JSON.stringify(postBody.financialConstraints))
    }
    if (postBody.optimization.threshold) {
      state.optimizationOptions.threshold = +postBody.optimization.threshold * 100
    }
    if (postBody.optimization.preIrrThreshold) {
      state.optimizationOptions.preIrrThreshold = +postBody.optimization.preIrrThreshold
    }
    if (postBody.optimization.budget && Number.isFinite(+postBody.optimization.budget)) {
      state.optimizationOptions.budget = +postBody.optimization.budget/1000
    }
    state.optimizationOptions.analysisSelectionMode = postBody.locationConstraints.analysisSelectionMode
    if (postBody.locationConstraints.analysisSelectionMode === state.selectionModes.SELECTED_AREAS) {
      optimization.setMode('boundaries')
    } else if (postBody.locationConstraints.analysisSelectionMode === state.selectionModes.SELECTED_LOCATIONS) {
      optimization.setMode('targets')
    } else if (postBody.locationConstraints.analysisSelectionMode === state.selectionModes.SELECTED_ANALYSIS_AREAS) {
      state.boundaries.tileLayers.forEach(layer => {
        if (layer.type === 'analysis_layer') {
          layer.visible = (layer.analysisLayerId === postBody.locationConstraints.analysisLayerId)
        }
      })
    }
  }

  // Load fiber network constraints from a POST body object that is sent to the optimization engine
  var loadFiberNetworkConstraintsFromBody = (state, postBody) => {
    if (postBody.networkConstraints && postBody.networkConstraints.routingMode) {
      state.optimizationOptions.networkConstraints.routingMode = postBody.networkConstraints.routingMode
    }

    if (postBody.networkConstraints
        && postBody.networkConstraints.cellNodeConstraints) {
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

    if (postBody.networkConstraints && postBody.networkConstraints.fiberRoutingMode &&
      postBody.networkConstraints.fiberRoutingMode == state.fiberRoutingModes.ROUTE_FROM_FIBER) {
      state.optimizationOptions.networkConstraints.routeFromFiber = true
    }
  }

  // Load technologies from a POST body object that is sent to the optimization engine
  var loadTechnologiesFromBody = (state, postBody) => {
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
