/* global $ app user_id swal _ google map config globalServiceLayers globalAnalysisLayers */
// Boundaries Controller
app.controller('boundaries_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_utils', 'MapLayer', 'tracker', 'regions', '$timeout', 'optimization', 'map_layers', 'state', '$location', ($scope, $rootScope, $http, map_tools, map_utils, MapLayer, tracker, regions, $timeout, optimization, map_layers, state, $location) => {
  $scope.map_tools = map_tools
  $scope.user_id = user_id

  $scope.selected_tool = false
  $scope.boundaries = []
  $scope.state = state

  $scope.userDefinedBoundaries = []
  $scope.selectedUserDefinedBoundary = null

  // selected regions
  $scope.selectedRegions = []
  $rootScope.$on('regions_changed', () => {
    $scope.selectedRegions = regions.selectedRegions.slice(0)
  })
  $scope.removeGeography = (geography) => {
    regions.removeGeography(geography)
  }
  $scope.removeAllGeographies = () => {
    regions.removeAllGeographies()
  }
  // --

  // Get the point transformation mode with the current zoom level
  var getPointTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
  }
  
  var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port();

  // Creates map layers based on selection in the UI
  var createdMapLayerKeys = new Set()
  var updateMapLayers = () => {
    return; // TODO - Parag. Shorted out while we are moving to tiles V2.0

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(state.mapLayers.getValue())
    
    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    createdMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    var mergedLayerUrls = []

    state.boundaries.tileLayers.forEach((layer) => { 

      if (layer.visible) {
        // Location type is visible
        //var mapLayerKey = `${locationType.key}_${dataSourceId}`
        var pointTransform = getPointTransformForLayer(+layer.aggregateZoomThreshold)
        var mapLayerKey = `${pointTransform}_${layer.type}_${layer.layerId}`
        
        var url = layer.api_endpoint.replace('${tilePointTransform}', pointTransform)
        url = url.replace('${layerId}', layer.layerId)

        if (pointTransform === 'smooth') {
          // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
          mergedLayerUrls.push(url)
        } else {
          // We want to create an individual layer
          oldMapLayers[mapLayerKey] = {
            dataUrls: [url],
            renderMode: 'PRIMITIVE_FEATURES',
            selectable: true,
            strokeStyle: '#00ff00',
            lineWidth: 4,
            fillStyle: "transparent",
            opacity: 0.7,
            zIndex: 3001, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
            highlightStyle: {
              strokeStyle: '#000000',
              fillStyle: 'green',
              opacity: 0.3
            }
          }
          createdMapLayerKeys.add(mapLayerKey)
        }

        if (mergedLayerUrls.length > 0) {
          // We have some business layers that need to be merged into one
          // We still have to specify an iconURL in case we want to debug the heatmap rendering. Pick any icon.
          oldMapLayers[mapLayerKey] = {
            dataUrls: mergedLayerUrls,
            renderMode: 'HEATMAP',
            selectable: true,
            aggregateMode: 'FLATTEN',
            strokeStyle: '#00ff00',
            lineWidth: 4,
            fillStyle: "transparent",
            opacity: 0.7,
            zIndex: 3001, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
            highlightStyle: {
              strokeStyle: '#000000',
              fillStyle: 'green',
              opacity: 0.3
            }
          }
          createdMapLayerKeys.add(mapLayerKey)
        }
      }
      
    })

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }

  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateMapLayers)
    
  var countySubdivisionsLayer
  var censusBlocksLayer
  var userDefinedLayer

  if (config.ui.map_tools.boundaries.view.indexOf('county_subdivisions') >= 0) {
    countySubdivisionsLayer = new MapLayer({
      short_name: 'CS',
      name: 'Counties',
      type: 'county_subdivisions',
      api_endpoint: '/county_subdivisions/36',
      highlighteable: true,
      style_options: {
        normal: {
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 2
        },
        highlight: {
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 2
        }
      },
      reload: 'always',
      threshold: 0,
      minZoom: 9,
      hoverField: 'name',
      visibilityThreshold : 1,
      isBoundaryLayer : true
    })
  }
  map_layers.addFeatureLayer(countySubdivisionsLayer);


  if (config.ui.map_tools.boundaries.view.indexOf('census_blocks') >= 0) {
    censusBlocksLayer = new MapLayer({
      type: 'census_blocks',
      short_name: 'CB',
      name: 'Census Blocks',
      api_endpoint: '/census_blocks/36/061',
      highlighteable: true,
      single_selection: true,
      reset_style_on_click: true,
      style_options: {
        normal: {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 2
        },
        highlight: {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 4
        },
        selected: {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 4
        }
      },
      threshold: 13,
      reload: 'dynamic',
      minZoom: 14,
      hoverField: 'name',
      visibilityThreshold : 1,
      isBoundaryLayer : true
    })

    map_layers.addFeatureLayer(censusBlocksLayer);
  }

  // $scope.userDefinedLayer = userDefinedLayer = new MapLayer({
  //   short_name: 'UD',
  //   name: 'User-defined boundaries',
  //   type: 'user_defined',
  //   style_options: {
  //     normal: {
  //       fillColor: 'green',
  //       strokeColor: 'green',
  //       strokeWeight: 2,
  //       fillOpacity: 0.1
  //     },
  //     highlight: {
  //       fillColor: 'green',
  //       strokeColor: 'green',
  //       strokeWeight: 2,
  //       fillOpacity: 0.1
  //     }
  //   },
  //   reload: 'always',
  //   threshold: 0,
  //   minZoom: 9,
  //   hoverField: 'name',
  //   visibilityThreshold : 1,
  //   isBoundaryLayer : true
  // })

  //map_layers.addFeatureLayer(userDefinedLayer);

  var analysisLayersColors = [
    'coral'
  ]

  globalAnalysisLayers.forEach((analysisLayer) => {
    var color = analysisLayersColors.shift() || 'black'
    var layer = new MapLayer({
      name: analysisLayer.description,
      type: analysisLayer.name,
      api_endpoint: `/analysis_areas/${analysisLayer.name}`,
      style_options: {
        normal: {
          fillColor: color,
          strokeColor: color,
          strokeWeight: 2
        },
        highlight: {
          fillColor: color,
          strokeColor: color,
          strokeWeight: 2
        },
        hoverField: 'name'
      },
      reload: 'always',
      threshold: 0,
      visibilityThreshold : 1,
      isBoundaryLayer : true
    })
    state.boundaries.areaLayers.push(layer)
    map_layers.addFeatureLayer(layer);
  })

  state.boundaries.areaLayers = state.boundaries.areaLayers.concat([
    countySubdivisionsLayer,
    censusBlocksLayer
  ].filter((layer) => layer))

  var serviceLayersColors = [
    '#00ff00', 'coral', 'darkcyan', 'dodgerblue'
  ]

  globalServiceLayers.forEach((serviceLayer) => {
    if (!serviceLayer.show_in_boundaries) return
    var wirecenter_layer = {
      name: serviceLayer.description,
      type: serviceLayer.name,
      api_endpoint: "/tile/v1/service_area/tiles/${layerId}/${tilePointTransform}/",
      layerId: serviceLayer.id,
      aggregateZoomThreshold: 10
    }
  
    state.boundaries.tileLayers.push(wirecenter_layer)
  })

  //state.boundaries.areaLayers.push(userDefinedLayer)

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: false,
    polygonOptions: {
      editable: true
    }
  })

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'boundaries' && !map_tools.is_visible('boundaries')) {
      $scope.removeDrawingManager()
    }
  })

  $rootScope.$on('map_layer_changed_visibility', () => {
    if (!$scope.$$phase) { $scope.$apply() } // refresh button state
  })

  $scope.plan = null

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    $scope.boundaries = []
    state.boundaries.areaLayers.forEach((layer) => {
      layer.hide()
      $(`#map_layers_toggle_${layer.type} input`).prop('checked', false)
    })
    if (!plan) return

    if (plan && (countySubdivisionsLayer || censusBlocksLayer)) {
      $http.get(`/network_plan/${plan.id}/area_data`)
        .then((response) => {
          countySubdivisionsLayer && countySubdivisionsLayer.setApiEndpoint('/county_subdivisions/' + response.data.statefp)
          censusBlocksLayer && censusBlocksLayer.setApiEndpoint(`/census_blocks/${response.data.statefp}/${response.data.countyfp}`)
        })
    }

    $http.get(`/boundary/${plan.id}/find`)
      .then((boundaries) => {
        $scope.boundaries = boundaries.data
        boundaries.data.forEach((boundary) => {
          var paths = []
          boundary.geom.coordinates[0][0].forEach((p) => {
            paths.push(new google.maps.LatLng(p[1], p[0]))
          })
          var overlay = new google.maps.Polygon({
            paths: paths,
            editable: plan.owner_id === user_id,
            strokeWeight: 2
          })
          boundary.overlay = overlay
          makeBoundaryEditable(boundary)
          updateTooltips()
        })
      })

    $scope.selectedUserDefinedBoundary = null
    $rootScope.selectedUserDefinedBoundary = null
    $http.get('/boundary/user_defined')
      .then((response) => {
        $scope.userDefinedBoundaries = response.data
      })
  })

  function updateTooltips () {
    setTimeout(() => {
      var tooltips = $('[ng-controller="boundaries_controller"] [data-toggle="tooltip"]')
      tooltips.tooltip()
    }, 1) // setTimeout to wait until the DOM is rendered
  }

  $scope.toggleBoundary = (boundary) => {
    boundary.overlay.setMap(boundary.overlay.getMap() ? null : map)
  }

  // $scope.changeUserDefinedBoundary = () => {
  //   $rootScope.selectedUserDefinedBoundary = $scope.selectedUserDefinedBoundary
  //   if (!$scope.selectedUserDefinedBoundary) {
  //     userDefinedLayer.setApiEndpoint(null)
  //   } else {
  //     var url = `/service_areas/${$scope.selectedUserDefinedBoundary.name}`
  //     userDefinedLayer.layerId = $scope.selectedUserDefinedBoundary.id
  //     userDefinedLayer.setApiEndpoint(url)
  //     userDefinedLayer.show()
  //     userDefinedLayer.reloadData()
  //   }
  // }

  $scope.toggleTool = () => {
    $scope.selected_tool = !$scope.selected_tool
    if ($scope.selected_tool) {
      drawingManager.setMap(map)
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
      map.setOptions({ draggable: false })
    } else {
      $scope.removeDrawingManager()
    }
  }

  $scope.removeDrawingManager = () => {
    drawingManager.setDrawingMode(null)
    drawingManager.setMap(null)
    map.setOptions({ draggableCursor: null, draggable: true })
    $scope.selected_tool = null
    // update the angular UI if this method is called for example
    // from a google maps event
    if (!$rootScope.$$phase) { $rootScope.$apply() }
  }

  drawingManager.addListener('overlaycomplete', (e) => {
    var overlay = e.overlay

    $scope.removeDrawingManager()

    swal({
      title: 'Give it a name',
      text: 'How do you want to name this boundary?',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: true,
      animation: 'slide-from-top',
      inputPlaceholder: 'Boundary name'
    }, (name) => {
      if (!name) {
        return overlay.setMap(null)
      }
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(toGeoJson(overlay))
      }

      $http.post('/boundary/' + $scope.plan.id + '/create', data)
        .then((boundary) => {
          $scope.boundaries.push(boundary.data)
          boundary.data.overlay = overlay
          makeBoundaryEditable(boundary.data)
          updateTooltips()
        })
    })
  })

  function toGeoJson (overlay, closed) {
    var coordinates = []
    var geo = { type: 'MultiPolygon', coordinates: [[ coordinates ]] }
    overlay.getPath().getArray().forEach((point) => {
      coordinates.push([point.lng(), point.lat()])
    })
    if (closed) {
      coordinates.push(coordinates[0])
    }
    return geo
  }

  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (map_tools.is_visible(map_tools.TOOL_IDS.AREA_NETWORK_PLANNING)) return
    if (true) return

    var name = event.feature.getProperty('name')
    if (event.feature.getGeometry().getType() === 'MultiPolygon') {
      event.feature.toGeoJson((obj) => {
        if (false) { // TODO
          $scope.networkPlanningBoundary(obj.geometry)
        } else {
          $rootScope.$broadcast('boundary_selected', obj.geometry, name, 'market_size')
        }
      })
    }
  })

  function makeBoundaryEditable (boundary) {
    var overlay = boundary.overlay

    function edit_boundary () {
      var data = {
        name: boundary.name,
        geom: JSON.stringify(toGeoJson(overlay))
      }
      $http.post('/boundary/' + $scope.plan.id + '/edit/' + boundary.id, data)
        .then((response) => {
          // yay!
        })
    }

    ;['set_at', 'insert_at', 'remove_at'].forEach((event_name) => {
      overlay.getPath().addListener(event_name, edit_boundary)
    })

    overlay.marker = new google.maps.Marker({
      title: boundary.name,
      map: map
    })

    overlay.marker.addListener('click', () => {
      if (map_tools.is_visible('network_planning')) {
        $scope.run_network_planning(boundary)
      } else if (map_tools.is_visible('financial_profile')) {
        $rootScope.$broadcast('custom_boundary_clicked', boundary)
      } else {
        $scope.show_market_size(boundary)
      }
    })

    overlay.marker.addListener('mouseover', () => {
      updateCounter(1)
    })

    overlay.marker.addListener('mouseout', () => {
      updateCounter(-1)
    })

    var count = 0
    var timer = null

    function updateCounter (i) {
      count += i
      timer && clearTimeout(timer)
      if (count > 0) {
        !overlay.marker.getMap() && overlay.marker.setMap(map)
        overlay.setOptions({
          strokeWeight: 4
        })
      } else {
        timer = setTimeout(() => {
          overlay.marker.setMap(null)
          overlay.setOptions({
            strokeWeight: 2
          })
        }, 250)
      }
    }

    overlay.addListener('mouseover', () => {
      overlay.setOptions({
        strokeWeight: 4
      })

      var bounds = new google.maps.LatLngBounds()
      overlay.getPath().getArray().forEach((point) => {
        bounds.extend(point)
      })

      overlay.marker.setPosition(bounds.getCenter())
      updateCounter(1)
    })

    overlay.addListener('mouseout', () => {
      updateCounter(-1)
    })
  }

  $scope.renameBoundary = (boundary) => {
    swal({
      title: 'Give it a new name',
      text: 'How do you want to name this boundary?',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: true,
      animation: 'slide-from-top',
      inputPlaceholder: 'Boundary name',
      inputValue: boundary.name
    }, (name) => {
      if (!name) return false
      var data = {
        name: name || 'Untitled boundary',
        geom: JSON.stringify(toGeoJson(boundary.overlay))
      }

      $http.post('/boundary/' + $scope.plan.id + '/edit/' + boundary.id, data)
        .then((response) => {
          boundary.name = name
        })
    })
  }

  $scope.networkPlanningBoundary = (geojson) => {
    var data = { boundary: geojson }
    var config = {
      url: '/network/nodes/' + $scope.plan.id + '/select_boundary',
      method: 'post',
      saving_plan: true,
      data: data
    }
    $http(config).then((response) => {
      $rootScope.$broadcast('route_planning_changed')
    })
  }

  $scope.deleteBoundary = (boundary) => {
    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted data!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/boundary/' + $scope.plan.id + '/delete/' + boundary.id)
        .then((response) => {
          boundary.overlay.setMap(null)
          $scope.boundaries = _.reject($scope.boundaries, (b) => boundary.id === b.id)
        })
    })
  }

  $scope.run_network_planning = (boundary) => {
    $scope.networkPlanningBoundary(toGeoJson(boundary.overlay, true))
  }

  $scope.show_market_size = (boundary) => {
    $rootScope.$broadcast('boundary_selected', toGeoJson(boundary.overlay, true), boundary.name, 'market_size')
  }

  $scope.show_customer_profile = (boundary) => {
    $rootScope.$broadcast('boundary_selected', toGeoJson(boundary.overlay, true), boundary.name, 'customer_profile')
  }

  $scope.select_area = (layer) => {
    var feature
    layer.data_layer.forEach((f) => {
      feature = f
    })
    if (!feature) return console.log('no feature')
    feature.toGeoJson((obj) => {
      $rootScope.$broadcast('boundary_selected', obj.geometry, layer.name)
    })
  }

  $scope.toggleVisibility = (layer) => {
    layer.visible = layer.visible_check;

    layer.configureVisibility()
    regions.setSearchOption(layer.type, layer.visible)
  }

  $scope.tilesToggleVisibility = (layer) => {
    layer.visible = layer.visible_check;
    updateMapLayers()
  }

  // $scope.createUserDefinedBoundary = () => {
  //   $rootScope.$broadcast('edit_user_defined_boundary', null)
  // }

  // $scope.editUserDefinedBoundary = (boundary) => {
  //   $rootScope.$broadcast('edit_user_defined_boundary', $scope.selectedUserDefinedBoundary)
  // }

  $scope.selectAllInLayer = () => {
    $http.get(`/service_areas/${$scope.selectedUserDefinedBoundary.name}/all`)
      .then((response) => {
        response.data.feature_collection.features.forEach((boundary) => {
          regions.selectGeography({
            id: boundary.properties.id,
            name: boundary.properties.name,
            geog: boundary.geometry,
            type: userDefinedLayer.type,
            layerId: userDefinedLayer.layerId
          })
        })
      })
  }

  // $rootScope.$on('saved_user_defined_boundary', (e, boundary) => {
  //   var existing = $scope.userDefinedBoundaries.find((item) => item.id === boundary.id)
  //   if (existing) {
  //     existing.name = boundary.name
  //     $scope.selectedUserDefinedBoundary = existing
  //   } else {
  //     $scope.userDefinedBoundaries.push(boundary)
  //     $scope.selectedUserDefinedBoundary = boundary
  //     var select = document.getElementById('userDefinedBoundariesSelect')
  //     select.scrollTop = select.scrollHeight
  //   }
  //   $scope.changeUserDefinedBoundary()
  // })

  $scope.optimizationMode = optimization.getMode()
  $rootScope.$on('optimization_mode_changed', (e, mode) => {
    $scope.optimizationMode = mode
  })

  $('#locationsUploadedCustomersSelect').select2({
    placeholder: 'Select one or more datasets'
  })
}])
