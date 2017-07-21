/* global app _ config user_id $ map google randomColor tinycolor Chart swal */
// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', '$location', 'configuration', 'map_tools', 'map_layers', 'MapLayer', 'CustomOverlay', 'tracker', 'optimization', 'state', ($scope, $rootScope, $http, $location, configuration, map_tools, map_layers, MapLayer, CustomOverlay, tracker, optimization, state) => {

  // Get the point transformation mode with the current zoom level
  var getPointTransformForLayer = (zoomThreshold) => {
    var transform = ''
    if (state.viewSetting.selectedHeatmapOption.getValue().id === 'HEATMAP_OFF') {
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

    // Hold a list of layers that we want merged
    var layersToMerge = {
      urls: [],
      iconUrl: null
    }

    // Add map layers based on the selection
    state.selectedDataSources.forEach((selectedDataSource) => {

      // Loop through the location types
      state.locationTypes.getValue().forEach((locationType) => {

        // Determine whether we want to add this locationtype + datasource combo
        var createLayer = true
        var dataSourceId = selectedDataSource.dataSourceId
        if (selectedDataSource.dataSourceId === state.DS_GLOBAL_BUSINESSES) {
          dataSourceId = 1  // This is the global data source id
          createLayer = locationType.key.indexOf('business') >= 0
        } else if (selectedDataSource.dataSourceId === state.DS_GLOBAL_HOUSEHOLDS) {
          dataSourceId = 1  // This is the global data source id
          createLayer = locationType.key.indexOf('household') >= 0
        } else if (selectedDataSource.dataSourceId === state.DS_GLOBAL_CELLTOWER) {
          dataSourceId = 1  // This is the global data source id
          createLayer = locationType.key.indexOf('tower') >= 0
        }

        if (locationType.checked && createLayer) {
          // Location type is visible
          var mapLayerKey = `${locationType.key}_${dataSourceId}`
          var pointTransform = getPointTransformForLayer(+locationType.aggregateZoomThreshold)
          var url = locationType.tileUrl.replace('${tilePointTransform}', pointTransform)
          url = url.replace('${dataSourceId}', dataSourceId)

          if (pointTransform === 'aggregate') {
            // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
            layersToMerge.urls.push(url)
            // Overwriting any previous iconUrl, will be ok as we are aggregating, so we dont use the icon
            layersToMerge.iconUrl = `${baseUrl}${locationType.iconUrl}`
          } else {
            oldMapLayers[mapLayerKey] = {
              url: [url],
              iconUrl: `${baseUrl}${locationType.iconUrl}`,
              isVisible: true,
              drawingOptions: {
                strokeStyle: '#00ff00',
                fillStyle: '#a0ffa0'
              },
              heatmapDebug: 'HEATMAP_OFF' // Always turn heatmap off when in 'select' mode
            }
            createdMapLayerKeys.add(mapLayerKey)
          }
        }
      })
    })

    if (layersToMerge.urls.length > 0) {
      // We have some business layers that need to be merged into one
      var mapLayerKey = 'aggregated_locations'
      oldMapLayers[mapLayerKey] = {
        url: layersToMerge.urls,
        iconUrl: layersToMerge.iconUrl,
        isVisible: true,
        drawingOptions: {
          strokeStyle: '#00ff00',
          fillStyle: '#a0ffa0'
        },
        heatmapDebug: state.viewSetting.selectedHeatmapOption.getValue().id
      }
      if (state.viewSetting.selectedHeatmapOption.getValue().id === 'HEATMAP_ON') {
        oldMapLayers[mapLayerKey].aggregateOptions= {
          aggregateEntityId: 'asdf',
          aggregateBy: 'weight',
          aggregateMode: 'simple_union'
        }
      }
      createdMapLayerKeys.add(mapLayerKey)
    }
    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }
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
        newLocationTypes[iLocationType].checked = isVisible
        break
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
  state.viewSetting.selectedHeatmapOption
    .subscribe((newValue) => updateMapLayers())

  // Debugging information for heatmaps
  $scope.debugClickedLocations = null
  $rootScope.$on('map_layer_clicked_feature', (event, options, map_layer) => {
    var clickedLocationsDescripton = ''
    options.forEach((feature) => clickedLocationsDescripton += JSON.stringify(feature) + '\n')
    $scope.debugClickedLocations = clickedLocationsDescripton
    $scope.$apply()
  })

  $scope.map_tools = map_tools
  $scope.selected_tool = null
  $scope.available_tools = [
    {
      key: 'commercial',
      name: 'Commercial'
    },
    {
      key: 'residential',
      name: 'Residential'
    },
    {
      key: 'combo',
      name: 'Combo'
    }
  ]
  $scope.overlay = 'none'
  $scope.roadLayer = new MapLayer({
    short_name: 'RS',
    name: 'Road Segments',
    type: 'road_segments',
    style_options: {
      normal: {
        strokeColor: 'teal',
        strokeWeight: 2
      }
    },
    api_endpoint: '/network/road_segments',
    threshold: 12,
    reload: 'always'
  })
  state.reloadDatasources() // Reload data sources even without a plan

  $scope.available_tools = _.reject($scope.available_tools, (tool) => {
    return config.ui.map_tools.locations.build.indexOf(tool.key) === -1
  })

  // The state.locations object will be updated after the configuration is loaded
  $scope.planState = state;

  $scope.new_location_data = null

  $('#create-location').on('shown.bs.modal', () => {
    $('#create-location select').val('').trigger('change')
  })

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'locations') {
      if (!map_tools.is_visible('locations')) {
        $scope.selected_tool = null
        map.setOptions({ draggableCursor: null })
      }
    }
  })

  $scope.create_location = () => {
    $http.post('/locations/create', $scope.new_location_data)
      .then((response) => {
        $('#create-location').modal('hide')
        $scope.new_location_data = {}
        locationsLayer.data_layer.addGeoJson(response.data)
      })
  }

  $scope.select_tool = (tool) => {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null
    } else {
      $scope.selected_tool = tool
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' })
  }

  $rootScope.$on('map_click', (e, event) => {
    if (!map_tools.is_visible('locations') || !$scope.selected_tool) return
    var lat = event.latLng.lat()
    var lng = event.latLng.lng()
    var address = encodeURIComponent(lat + ',' + lng)
    $scope.new_location_data = {
      type: $scope.selected_tool,
      lat: lat,
      lon: lng
    }
    $('#create-location').modal('show')
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address)
      .then((response) => {
        var results = response.data.results
        var result = results[0]
        if (!result) return
        $scope.new_location_data.address = result.formatted_address
        var components = result.address_components
        components.forEach((component) => {
          var types = component.types
          if (types.indexOf('postal_code') >= 0) {
            $scope.new_location_data.zipcode = component.long_name
          } else if (types.indexOf('locality') >= 0) {
            $scope.new_location_data.city = component.long_name.toUpperCase()
          } else if (types.indexOf('administrative_area_level_1') >= 0) {
            $scope.new_location_data.state = component.short_name.toUpperCase()
          }
        })
      })
  })

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    optimization.datasources = []

    if (plan) {
      plan.location_types = plan.location_types || []
      map.ready(() => {
        selectedLocationsLayer.show()
        selectedLocationsLayer.reloadData()
      })
    }

    state.reloadDatasources()
  })

  $rootScope.$on('uploaded_data_sources', (e, info) => {
    state.reloadDatasources()
    $scope.planState.selectedDataSources.push(info);
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

  $(document).keydown(function (e) {
    if (e.keyCode === 27 && $scope.measuringStickEnabled) {
      $scope.toggleMeasuringStick()
    }
  })

  $scope.addCustomers = () => {
    $rootScope.$broadcast('upload_customers')
  }
}])
