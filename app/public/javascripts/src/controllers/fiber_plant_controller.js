/* global app config $ _ google map */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$rootScope', '$location', 'state', 'map_tools', ($scope, $rootScope, $location, state, map_tools) => {

  $scope.map_tools = map_tools
  $scope.planState = state

  // Sliders for testing different rendering modes
  $scope.minAggregatedValue = 0.0
  $scope.maxAggregatedValue = 1.0
  $scope.showBlockHeatMap = false

  // Update map layers based on the selections in the state object
  var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port();
  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  var updateMapLayers = () => {

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    createdMapLayerKeys.clear()

    // Add map layers based on the selection
    var censusBlockUrls = []
    var mapLayerKey = `competitor_censusBlocks`
    const CENSUS_BLOCK_ZOOM_THRESHOLD = 11
    var blockType = map.getZoom() > CENSUS_BLOCK_ZOOM_THRESHOLD ? 'census-block' : 'census-block-group'
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
    var providerType = state.competition.selectedCompetitorType.id

    if (state.competition.showCensusBlocks && dataSource) {
      var aggregateOptionsType = null, cbStrokeStyle = null, cbFillStyle = null
      if (state.competition.useAllCompetitors) {
        // Our endpoint uses "all competitors"
        censusBlockUrls.push(`/tile/v1/competitive/${dataSource}/strength/${providerType}/${blockType}/poly/${polyTransform}/`)
        aggregateOptionsType = 'all'
        cbStrokeStyle = '#000000'
        cbFillStyle = '#505050'
      } else {
        // We want to use only the selected competitors
        state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
          var carrierId = selectedCompetitor.id
          censusBlockUrls.push(`/tile/v1/competitive/${dataSource}/carrier/${carrierId}/${providerType}/${blockType}/${polyTransform}/`)
        })
        aggregateOptionsType = 'individual'
        if (state.competition.selectedCompetitors.length > 0) {
          cbStrokeStyle = state.competition.selectedCompetitors[0].strokeStyle
          cbFillStyle = state.competition.selectedCompetitors[0].fillStyle
        }
      }

      if (censusBlockUrls.length > 0) {
        var mapLayer = {
          dataUrls: censusBlockUrls,
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: cbStrokeStyle,
          fillStyle: cbFillStyle,
          zIndex: 1041, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
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

    // Create fiber routes layer
    if (state.competition.showFiberRoutes) {
      var fiberLineWidth = 2
      if (state.competition.useAllCompetitors) {
        var mapLayerKey = `competitor_fiberRoutes_all`
        oldMapLayers[mapLayerKey] = {
          dataUrls: [`/tile/v1/fiber/competitive/all/tiles/line/${lineTransform}/`],
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: '#000000',
          fillStyle: '#000000',
          zIndex: 1042, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
          lineWidth: fiberLineWidth
        }
        createdMapLayerKeys.add(mapLayerKey)
      } else {
        state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
          var mapLayerKey = `competitor_fiberRoutes_${providerType}_${selectedCompetitor.id}`
          oldMapLayers[mapLayerKey] = {
            dataUrls: [`/tile/v1/fiber/competitive/carrier/${selectedCompetitor.id}/tiles/line/${lineTransform}/`],
            iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
            strokeStyle: selectedCompetitor.strokeStyle,
            fillStyle: selectedCompetitor.fillStyle,
            zIndex: 1043, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
            lineWidth: fiberLineWidth
          }
          createdMapLayerKeys.add(mapLayerKey)
        })
      }
    }

    // Create fiber routes buffer layer. Copy-pasted from "fiber routes layer" as the endpoints are changing at the moment.
    if (state.competition.showFiberRoutesBuffer) {
      if (state.competition.useAllCompetitors) {
        var mapLayerKey = `competitor_fiberRoutesBuffer_all`
        oldMapLayers[mapLayerKey] = {
          dataUrls: [`/tile/v1/fiber/competitive/all/tiles/buffer/${polyTransform}/`],
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: '#000000',
          zIndex: 1044, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
          fillStyle: '#000000'
        }
        createdMapLayerKeys.add(mapLayerKey)
      } else {
        state.competition.selectedCompetitors.forEach((selectedCompetitor) => {
          var mapLayerKey = `competitor_fiberRoutesBuffer_${providerType}_${selectedCompetitor.id}`
          oldMapLayers[mapLayerKey] = {
            dataUrls: [`/tile/v1/fiber/competitive/carrier/${selectedCompetitor.id}/tiles/buffer/${polyTransform}/`],
            iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
            strokeStyle: selectedCompetitor.strokeStyle,
            fillStyle: selectedCompetitor.fillStyle,
            zIndex: 1045, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
            opacity: 0.4
          }
          createdMapLayerKeys.add(mapLayerKey)
        })
      }
    }

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
  
  function reloadCompetitors() {
    state.reloadCompetitors()
  }

  reloadCompetitors()
  
  $rootScope.$on('map_dragend', () => {
    if (map_tools.is_visible('fiber_plant'))
      reloadCompetitors()
  })
  
  $rootScope.$on('map_zoom_changed', () => {
    if (map_tools.is_visible('fiber_plant'))
      reloadCompetitors()
    updateMapLayers()
  })

}])
