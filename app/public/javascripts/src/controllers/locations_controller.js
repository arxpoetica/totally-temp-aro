/* global app _ config user_id $ map google randomColor tinycolor Chart swal */
// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', '$location', '$timeout','configuration', 'map_tools', 'optimization', 'state', ($scope, $rootScope, $http, $location, $timeout, configuration, map_tools, optimization, state) => {

  // Get the point transformation mode with the current zoom level
  var getPointTransformForLayer = (zoomThreshold) => {
    var transform = ''
    if (state.mapTileOptions.getValue().selectedHeatmapOption.id === 'HEATMAP_OFF') {
      // The user has explicitly asked to display points, not aggregates
      transform = 'select'
    } else {
      var mapZoom = map.getZoom()
      // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
      // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
      transform = (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
    }
    return transform
  }

  // Replaces any occurrences of searchText by replaceText in the keys of an object
  var objectKeyReplace = (obj, searchText, replaceText) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
      }
    })
  }
  $scope.locationFilters = state.locationFilters;
  var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port();
  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  $scope.disablelocations = false
  var updateMapLayers = $scope.updateMapLayers = () => {

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    createdMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    var mergedLayerDefinitions = []

    // Add map layers based on the selection
    var selectedLocationLibraries = state.dataItems && state.dataItems.location && state.dataItems.location.selectedLibraryItems
    if (selectedLocationLibraries) {
      selectedLocationLibraries.forEach((selectedLocationLibrary) => {
        // Loop through the location types
        state.locationTypes.getValue().forEach((locationType) => {
        	  if (locationType.checked 
            //Temp: 155808171 preventing calls to service if zoom is between 1 to 9 as service is not ready with pre-caching
            && map && map.getZoom() >= 10) {
            $scope.disablelocations = false
            $timeout()

            if (configuration.perspective.hasLocationFilters) {
              var hasFiltersSelected = $scope.locationFilters.filter((f)=>{return f.checked}).length > 0
              if (hasFiltersSelected){
                asGroup()
              }
              else {
                asSingle()
              }
            }

            // Returns a feature filter if we are in "sales" mode, otherwise return null
            function getFilterIfSales(locationType) {
              if (!locationType.isSalesTile) {
                return null
              }
              return (feature) => {
                return (feature.properties.salesCategory === locationType.categoryKey)
              }
            }

            function asSingle() {
              // Location type is visible
              var mapLayerKey = `${locationType.key}_${selectedLocationLibrary.identifier}`
              var pointTransform = getPointTransformForLayer(+locationType.aggregateZoomThreshold)
              var tileDefinition = angular.copy(locationType.tileDefinition)
              objectKeyReplace(tileDefinition, '${tilePointTransform}', pointTransform)
              objectKeyReplace(tileDefinition, '${libraryId}', selectedLocationLibrary.identifier)

              if (pointTransform === 'aggregate') {
                // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
                mergedLayerDefinitions.push(tileDefinition)
              } else {
                // We want to create an individual layer
                oldMapLayers[mapLayerKey] = {
                  tileDefinitions: [tileDefinition],
                  iconUrl: `${baseUrl}${locationType.iconUrl}`,
                  renderMode: 'PRIMITIVE_FEATURES',
                  zIndex: locationType.zIndex, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
                  selectable: true,
                  featureFilter: getFilterIfSales(locationType)
                }
                createdMapLayerKeys.add(mapLayerKey)
              }
            }

            function asGroup() {

              for (let filter of $scope.locationFilters) {
                if(filter.checked) {
                  // Location type is visible
                  var mapLayerKey = `${locationType.key}_${filter.name}_${selectedLocationLibrary.identifier}`
                  var pointTransform = getPointTransformForLayer(+locationType.aggregateZoomThreshold)
                  var tileDefinition = angular.copy(locationType.tileDefinition)
                  objectKeyReplace(tileDefinition, '${tilePointTransform}', pointTransform)
                  objectKeyReplace(tileDefinition, '${libraryId}', selectedLocationLibrary.identifier)
                  objectKeyReplace(tileDefinition, '${locationType}', filter.name)

                  if (pointTransform === 'aggregate') {
                    // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
                    mergedLayerDefinitions.push(tileDefinition)
                  } else {
                    // We want to create an individual layer
                    oldMapLayers[mapLayerKey] = {
                      tileDefinitions: [tileDefinition],
                      iconUrl: `${baseUrl}${filter.icon}`,
                      renderMode: 'PRIMITIVE_FEATURES',
                      zIndex: locationType.zIndex, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
                      selectable: true
                    }
                    createdMapLayerKeys.add(mapLayerKey)
                  }
                }
              }
            }
          }
          else if (map && map.getZoom() < 10){
            $scope.disablelocations = true
            $timeout();
          }
          else if (map && map.getZoom() >= 10){
            $scope.disablelocations = false
            $timeout();
          }
        })
      })
    }

    if (mergedLayerDefinitions.length > 0) {
      // We have some business layers that need to be merged into one
      // We still have to specify an iconURL in case we want to debug the heatmap rendering. Pick any icon.
      var firstLocation = state.locationTypes.getValue()[0]
      var mapLayerKey = 'aggregated_locations'
      oldMapLayers[mapLayerKey] = {
        tileDefinitions: mergedLayerDefinitions,
        iconUrl: `${baseUrl}${firstLocation.iconUrl}`,
        renderMode: 'HEATMAP',
        zIndex: 6500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
        aggregateMode: 'FLATTEN'
      }
      createdMapLayerKeys.add(mapLayerKey)
    }
    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }
  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateMapLayers)

  // Create a new set of map layers
  state.appReadyPromise.then(() => {
    updateMapLayers()
  })

  // Update old and new map layers when data sources change
  $scope.onSelectedDataSourcesChanged = () => {
    updateMapLayers()             // New "tile" layers
  }

  // Upward data flow (updating map layer state)
  $scope.setLocationTypeVisibility = (locationType, isVisible) => {
    var newLocationTypes = angular.copy(state.locationTypes.getValue())

    for (var iLocationType = 0; iLocationType < newLocationTypes.length; ++iLocationType) {
      if (newLocationTypes[iLocationType].key === locationType.key) {
        newLocationTypes[iLocationType].checked =  isVisible
      }
      if (newLocationTypes[iLocationType].group !== locationType.group){
         newLocationTypes[iLocationType].checked = false
      }
    }
    state.locationTypes.next(newLocationTypes)
  }

  // Watch for changes in the locationTypes and trigger a map layer update when that happens
  $scope.derivedLocationTypes = []
  state.locationTypes.subscribe((newValue) => {
    $scope.derivedLocationTypes = newValue  // For the checkboxes to bind to
    updateMapLayers()
  })

  // Update map layers when the heatmap options change
  state.mapTileOptions
    .subscribe((newValue) => updateMapLayers())

  // Update map layers when the dataItems property of state changes
  state.dataItemsChanged
    .subscribe((newValue) => updateMapLayers())

  // Update map layers when the selection type in analysis mode changes
  state.selectionTypeChanged.subscribe((newValue) => updateMapLayers())
  
  // Update map layers when the display mode button changes
  state.selectedDisplayMode.subscribe((newValue) => updateMapLayers())

  $scope.map_tools = map_tools

  // The state.locations object will be updated after the configuration is loaded
  $scope.planState = state;
  $scope.configuration = configuration

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    optimization.datasources = []

    if (plan) {
      plan.location_types = plan.location_types || []
    }
  })

  $scope.overlay_is_loading = () => {
    return customerProfileLayer.is_loading
  }

  $scope.selectedFilter = null
  $scope.toggleFilter = (filter) => {
    $scope.selectedFilter = $scope.selectedFilter === filter ? null : filter
  }

  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (layer.type !== 'road_segments') return
    var feature = event.feature
    layer.data_layer.revertStyle()
    layer.data_layer.overrideStyle(feature, {
      strokeWeight: 4
    })
    swal({ title: '', text: `gid: ${feature.getProperty('gid')} tlid: ${feature.getProperty('tlid')}`, type: 'info' })
  })

  var latestOverlay = null
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYLINE,
    drawingControl: false
  })

  drawingManager.addListener('overlaycomplete', (e) => {
    removeLatestOverlay()
    latestOverlay = e.overlay

    var points = e.overlay.getPath()
    var total = 0
    var prev = null
    points.forEach((point) => {
      if (prev) {
        total += google.maps.geometry.spherical.computeDistanceBetween(prev, point)
      }
      prev = point
    })
    $scope.measuredDistance = total
    if (!$scope.$$phase) { $scope.$apply() } // refresh UI
  })

  function removeLatestOverlay () {
    latestOverlay && latestOverlay.setMap(null)
    latestOverlay = null
  }

  $scope.toggleMeasuringStick = () => {
    var current = drawingManager.getMap()
    drawingManager.setMap(current ? null : map)
    removeLatestOverlay()
    $scope.measuringStickEnabled = !current
    if (current) $scope.measuredDistance = null
  }

  $scope.currentUser = state.loggedInUser
  $scope.showFilters = config.ARO_CLIENT === 'frontier'

  $(document).keydown(function (e) {
    if (e.keyCode === 27 && $scope.measuringStickEnabled) {
      $scope.toggleMeasuringStick()
    }
  })
}])
