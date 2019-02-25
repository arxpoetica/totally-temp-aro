/* global app config $ _ google map */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$rootScope', '$location', 'state', 'map_tools', ($scope, $rootScope, $location, state, map_tools) => {
  $scope.map_tools = map_tools
  $scope.state = state

  // Sliders for testing different rendering modes
  $scope.minAggregatedValue = 0.0
  $scope.maxAggregatedValue = 1.0
  $scope.showBlockHeatMap = false

  // Create map layers for census blocks
  const createLayersForCensusBlocks = (mapLayerKey, state, dataSource, oldMapLayers, createdMapLayerKeys) => {
    var censusBlockTileDefinitions = []
    const CENSUS_BLOCK_ZOOM_THRESHOLD = 11
    var blockType = map.getZoom() > CENSUS_BLOCK_ZOOM_THRESHOLD ? 'census-block' : 'census-block-group'
    const providerType = state.competition.selectedCompetitorType.id
    const polyTransform = map.getZoom() > 5 ? 'select' : 'smooth'
    const selectedCompetitionResourceManager = state.resourceItems && state.resourceItems.competition_manager && state.resourceItems.competition_manager.selectedManager
    if (state.competition.showCensusBlocks && dataSource) {
      var aggregateOptionsType = null; var cbStrokeStyle = null; var cbFillStyle = null
      if (state.competition.useAllCompetitors) {
        // Our endpoint uses "all competitors"
        const strengthDescriptor = (blockType === 'census-block') ? 'cb-strength' : 'cbg-strength'
        var cbTileDefinition = {
          dataId: `v1.competitive.${dataSource}.${providerType}.${strengthDescriptor}.tiles.poly.${polyTransform}.${selectedCompetitionResourceManager.id}`,
          vtlType: (blockType === 'census-block') ? 'CompetitiveCBPolyLayer' : 'CompetitiveCBGPolyLayer',
          strengthResourceManagerId: selectedCompetitionResourceManager.id,
          networkDataSource: dataSource,
          providerType: providerType,
          transform: polyTransform
        }
        censusBlockTileDefinitions.push(cbTileDefinition)
        aggregateOptionsType = 'all'
        cbStrokeStyle = '#000000'
        cbFillStyle = '#505050'
      } else {
        // We want to use only the selected competitors
        state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
          var carrierId = selectedCompetitor.id
          var cbTileDefinition = {
            dataId: `v1.competitive-carrier.${dataSource}.${carrierId}.${blockType}.tiles.${providerType}.${polyTransform}.${selectedCompetitionResourceManager.id}`,
            vtlType: (blockType === 'census-block') ? 'CompetitiveCBProviderLayer' : 'CompetitiveCBGProviderLayer',
            strengthResourceManagerId: selectedCompetitionResourceManager.id,
            networkDataSource: dataSource,
            carrierId: carrierId,
            providerType: providerType,
            transform: polyTransform
          }
          censusBlockTileDefinitions.push(cbTileDefinition)
        })
        aggregateOptionsType = 'individual'
        if (state.competition.selectedCompetitors.length > 0) {
          cbStrokeStyle = state.competition.selectedCompetitors[0].strokeStyle
          cbFillStyle = state.competition.selectedCompetitors[0].fillStyle
        }
      }

      if (censusBlockTileDefinitions.length > 0) {
        var mapLayer = {
          tileDefinitions: censusBlockTileDefinitions,
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: cbStrokeStyle,
          fillStyle: cbFillStyle,
          zIndex: 1041,
          opacity: 0.6
        }

        // Set aggregation options
        if (state.competition.selectedRenderingOption.aggregate) {
          mapLayer.aggregateMode = 'BY_ID'
          mapLayer.aggregateById = state.competition.selectedRenderingOption.aggregate[aggregateOptionsType][blockType].aggregateById,
          mapLayer.aggregateProperty = state.competition.selectedRenderingOption.aggregate[aggregateOptionsType][blockType].aggregateProperty

          // Make sure min/max aggregated values are correct
          var minAggregatedValue = Math.min($scope.minAggregatedValue, 0.99)
          var maxAggregatedValue = Math.max(0.01, $scope.maxAggregatedValue)
          if (maxAggregatedValue < minAggregatedValue) {
            $scope.maxAggregatedValue = maxAggregatedValue = minAggregatedValue + 0.01
          }
          mapLayer.aggregateMinPalette = minAggregatedValue
          mapLayer.aggregateMaxPalette = maxAggregatedValue
          mapLayer.renderMode = $scope.showBlockHeatMap ? 'AGGREGATE_GRADIENT' : 'AGGREGATE_OPACITY'
        } else {
          mapLayer.aggregateMode = 'FLATTEN'
          mapLayer.renderMode = 'PRIMITIVE_FEATURES'
        }

        oldMapLayers[mapLayerKey] = mapLayer
        createdMapLayerKeys.add(mapLayerKey)
      }
    }
  }

  // Create map layers for fiber
  const createLayersForFiber = (mapLayerKey, state, lineTransform, oldMapLayers, createdMapLayerKeys) => {
    // Create fiber routes layer
    if (state.competition.showFiberRoutes) {
      const fiberLineWidth = 2
      const providerType = state.competition.selectedCompetitorType.id
      if (state.competition.useAllCompetitors) {
        var fiberTileDefinition = {
          dataId: `v1.tiles.fiber.competitive.all.line.${lineTransform}`,
          vtlType: 'CompetitiveAllFiberLayer',
          lineTransform: lineTransform
        }
        var mapLayerKey = `competitor_fiberRoutes_all`
        oldMapLayers[mapLayerKey] = {
          tileDefinitions: [fiberTileDefinition],
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: '#000000',
          fillStyle: '#000000',
          zIndex: 1042,
          lineWidth: fiberLineWidth
        }
        createdMapLayerKeys.add(mapLayerKey)
      } else {
        state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
          var fiberTileDefinition = {
            dataId: `v1.tiles.fiber.competitive.carrier.line.${selectedCompetitor.id}.${lineTransform}`,
            vtlType: 'CompetitiveFiberLayer',
            lineTransform: lineTransform,
            carrierId: selectedCompetitor.id
          }
          var mapLayerKey = `competitor_fiberRoutes_${providerType}_${selectedCompetitor.id}`
          oldMapLayers[mapLayerKey] = {
            tileDefinitions: [fiberTileDefinition],
            iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
            strokeStyle: selectedCompetitor.strokeStyle,
            fillStyle: selectedCompetitor.fillStyle,
            zIndex: 1043,
            lineWidth: fiberLineWidth
          }
          createdMapLayerKeys.add(mapLayerKey)
        })
      }
    }
  }

  const createLayersForFiberBuffer = (mapLayerKey, state, lineTransform, polyTransform, oldMapLayers, createdMapLayerKeys) => {
    // Create fiber routes buffer layer.
    if (state.competition.showFiberRoutesBuffer) {
      const providerType = state.competition.selectedCompetitorType.id
      if (state.competition.useAllCompetitors) {
        var allFiberBufferTileDefinition = {
          dataId: `v1.tiles.fiber.competitive.buffer.all.buffer.${polyTransform}`,
          vtlType: 'CompetitiveAllFiberBufferLayer',
          lineTransform: lineTransform
        }
        var mapLayerKey = `competitor_fiberRoutesBuffer_all`
        oldMapLayers[mapLayerKey] = {
          tileDefinitions: [allFiberBufferTileDefinition],
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: '#000000',
          zIndex: 1044,
          fillStyle: '#000000'
        }
        createdMapLayerKeys.add(mapLayerKey)
      } else {
        state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
          var fiberBufferTileDefinition = {
            dataId: `v1.tiles.fiber.competitive.carrier.buffer.${selectedCompetitor.id}.${polyTransform}`,
            vtlType: 'CompetitiveFiberBufferLayer',
            carrierId: selectedCompetitor.id,
            polyTransform: polyTransform
          }
          var mapLayerKey = `competitor_fiberRoutesBuffer_${providerType}_${selectedCompetitor.id}`
          oldMapLayers[mapLayerKey] = {
            tileDefinitions: [fiberBufferTileDefinition],
            iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
            strokeStyle: selectedCompetitor.strokeStyle,
            fillStyle: selectedCompetitor.fillStyle,
            zIndex: 1045,
            opacity: 0.4
          }
          createdMapLayerKeys.add(mapLayerKey)
        })
      }
    }
  }

  // Update map layers based on the selections in the state object
  var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port()
  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  var updateMapLayers = () => {
    // We need a competition resource manager selected before we can update any layers
    const selectedCompetitionResourceManager = state.resourceItems && state.resourceItems.competition_manager && state.resourceItems.competition_manager.selectedManager
    if (!selectedCompetitionResourceManager) {
      console.warn('The user attempted to show competitor networks, but a competition resource manager has not been selected yet. Skipping...')
      return
    }

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    createdMapLayerKeys.clear()

    // Add map layers based on the selection
    var mapLayerKey = `competitor_censusBlocks`
    var polyTransform = map.getZoom() > 5 ? 'select' : 'smooth'
    var lineTransform = map.getZoom() > 10 ? 'select' : 'smooth_absolute'
    var dataSource = null
    if (state.competition.useNBMDataSource && state.competition.useGeotelDataSource) {
      dataSource = 'nbm_geotel'
    } else if (state.competition.useNBMDataSource) {
      dataSource = 'nbm'
    } else if (state.competition.useGeotelDataSource) {
      dataSource = 'geotel'
    }

    createLayersForCensusBlocks(mapLayerKey, state, dataSource, oldMapLayers, createdMapLayerKeys)
    createLayersForFiber(mapLayerKey, state, lineTransform, oldMapLayers, createdMapLayerKeys)
    createLayersForFiberBuffer(mapLayerKey, state, lineTransform, polyTransform, oldMapLayers, createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }

  // Called when the selected competitor type changes
  $scope.onCompetitorTypeChanged = () => {
    state.reloadCompetitors()
      .then(() => updateMapLayers())
  }

  $scope.onSelectedCompetitorsChanged = () => {
    updateMapLayers()
  }

  $scope.onDataSourceChanged = () => {
    updateMapLayers()
  }

  $scope.toggleShowSurveyData = () => {
    state.competition.showCensusBlocks = !state.competition.showCensusBlocks
    updateMapLayers()
  }

  $scope.toggleShowFiberRoutesData = () => {
    state.competition.showFiberRoutes = !state.competition.showFiberRoutes
    updateMapLayers()
  }

  $scope.toggleShowFiberRoutesBufferData = () => {
    state.competition.showFiberRoutesBuffer = !state.competition.showFiberRoutesBuffer
    updateMapLayers()
  }

  $scope.onRenderingChanged = () => {
    updateMapLayers()
  }

  $scope.onUseAllCompetitorsChanged = () => {
    // When we use all competitors, de-select any individual competitors
    if (state.competition.useAllCompetitors) {
      state.competition.selectedCompetitors = []
    }
    updateMapLayers()
  }

  function reloadCompetitors () {
    state.reloadCompetitors()
  }

  reloadCompetitors()

  $rootScope.$on('map_dragend', () => {
    if (map_tools.is_visible('fiber_plant')) { reloadCompetitors() }
  })

  $rootScope.$on('map_zoom_changed', () => {
    if (map_tools.is_visible('fiber_plant')) { reloadCompetitors() }
    updateMapLayers()
  })
}])
