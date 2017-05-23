/* global app user_id config map _ google swal config $ globalServiceLayers globalExistingFiberSourceNames */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', '$timeout', 'optimization', 'state', 'fiberGraph', ($scope, $rootScope, $http, map_tools, MapLayer, $timeout, optimization, state, fiberGraph) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.user_id = user_id
  $scope.ARO_CLIENT = config.ARO_CLIENT

  $scope.selected_tool = null
  $scope.vztfttp = true
  $scope.planState = state;
  $scope.serviceLayers = []
  $scope.existingFibers=[];
  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (map_tools.is_visible('network_nodes')) {
      $scope.serviceLayers.forEach((layer) => {
        layer.networkNodesLayer.show()
        layer.fixedWirelessCoverage.show()
      })
      userDefinedLayer.hidden = !$rootScope.selectedUserDefinedBoundary
      var value = ($rootScope.selectedUserDefinedBoundary && $rootScope.selectedUserDefinedBoundary.id) || 'user_defined'
      if (userDefinedLayer.id !== value) {
        userDefinedLayer.id = value
        userDefinedLayer.changeNodeTypesVisibility()
      }
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    } else if (tool === 'network_nodes') {
      $scope.selected_tool = null
      map.setOptions({ draggableCursor: null })
    }
  })

  $rootScope.$on('route_planning_changed', () => {
    $scope.serviceLayers.forEach((layer) => {
      layer.networkNodesLayer.reloadData(true)
      layer.fixedWirelessCoverage.reloadData(true)
    })
  })

  $scope.select_tool = (tool) => {
    if ($scope.selected_tool === tool) {
      $scope.selected_tool = null
    } else {
      $scope.selected_tool = tool
    }
    map.setOptions({ draggableCursor: $scope.selected_tool === null ? null : 'crosshair' })
  }

  var userDefinedLayer = {
    id: 'user_defined',
    name: 'user_defined',
    description: 'User-Uploaded',
    equipment_description: 'User-Uploaded',
    additional: true,
    nodeTypes: [{
      description: 'Central Office',
      id: 1,
      name: 'central_office',
      service_layer_id: -1,
      service_layer_node_name: 'Central Office'
    }],
    hidden: true,
    userDefined: true
  }

  $(document).ready(() => {
    map.ready(() => {
      $scope.serviceLayers = JSON.parse(JSON.stringify(globalServiceLayers)).filter((layer) => layer.show_in_assets)
      $scope.serviceLayers.push(userDefinedLayer)
      var additionalLayer = {
        id: 'all',
        name: 'all',
        description: 'Optimized equipment',
        equipment_description: 'Optimized equipment',
        additional: true,
        nodeTypes: globalServiceLayers[0].nodeTypes.map((item) => Object.assign({}, item)),
        needsPlan : true
      }
      $scope.serviceLayers.push(additionalLayer)
      $scope.existingFibers = globalExistingFiberSourceNames.map((name) => {
        return new MapLayer({
          name: name,
          type: 'fiber_plant',
          id :Math.random().toString(36).substr(2 , 10), //random id works
          short_name: 'F',
          api_endpoint: `/network/fiber_plant/current_carrier/${name}`,
          style_options: {
            normal: {
              strokeColor: config.ui.colors.fiber,
              strokeWeight: 2,
              fillColor: config.ui.colors.fiber
            }
          },
          threshold: 0,
          reload: 'always'
        })
      });

      var existingFiberLayer = {
        id: 'existing_fiber',
        name: 'existing_fiber',
        description: 'Existing Fiber',
        equipment_description: 'Existing Fiber',
        additional: true,
        layers: $scope.existingFibers
      }

      $scope.serviceLayers.push(existingFiberLayer)
      if ($scope.serviceLayers.length > 0) {
        var layer = $scope.serviceLayers[0]
        // layer.enabled = true
        $timeout(() => {
          $(`#serviceLayer${layer.id}`).addClass('in')
          // $scope.serviceLayers.slice(1).forEach((layer) => {
          //   $(`#serviceLayer${layer.id}`).addClass('disabled')
          // })
        }, 1)
      }
      $scope.serviceLayers.forEach((layer) => {
        configureServiceLayer(layer)
      })
    })
  })

  function upWardStyle() {
    return (feature, styles) => {
      var isSelected = feature.getProperty("isSelected");
      styles.strokeColor = isSelected ? 'green' : '#419df4';
    }
  }

  // Create a map layer for showing the "Upward route", i.e. the route from a given fiber
  // strand to the central office
  $scope.upwardRouteLayer = new MapLayer({
    name: name,
    type: 'upward_route_layer',
    short_name: 'U',
    api_endpoint: '',
    style_options: {
      normal: {
        strokeColor: 'red',
        strokeWeight: 10,
        zIndex: MapLayer.Z_INDEX_UPWARD_FIBER_STRANDS
      }
    },
    declarativeStyles: upWardStyle(),
    threshold: 0,
    reload: 'always'
  });

  $scope.hoverLayer = new MapLayer({
    name: name,
    type: 'hover_route_layer',
    short_name: 'U',
    api_endpoint: '',
    style_options: {
      normal: {
        strokeColor: 'green',
        strokeWeight: 10,
        zIndex: 98
      }
    },
    threshold: 0,
    reload: 'always'
  })



  var fiberGraphForPlan = fiberGraph
  // reload fiber graph when plan changes
  var reloadFiberGraph = () => {
    // Get the data again from the server. This is because some geometries are empty and are not
    // put into the map, so we cant get it from mapLayer.features
    fiberGraphForPlan = fiberGraph
    if (state.planId !== state.INVALID_PLAN_ID) {
      $http.get(`/network/fiber/connectivityForPlan/${state.planId}`)
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            var links = response.data
            links.forEach((link) => {
              // Add an edge with id, from_node_id, to_node_id and with the actual feature object
              fiberGraphForPlan.addEdge(link.id, link.from_node_id, link.to_node_id, link.geo_json ,link.name)
            })
          }
        })
    }
  }

  var reloadFiberStyles = ()=>{
    $scope.serviceLayers.forEach((layer) => {
      layer.routeLayer.revertStyles();
    })
  }

  // Subscribe to different plan events
  $rootScope.$on('plan_selected', (e, plan) => reloadFiberGraph())
  $rootScope.$on('plan_cleared', (e, plan) => reloadFiberGraph())
  $rootScope.$on('route_planning_changed', (e, plan) => reloadFiberGraph())

  // When we mouseover on a fiber strand, find the upward route from that strand and show it in the upward route layer
  $rootScope.$on('map_layer_clicked_feature', (event, args) => {
    var feature2 = args.feature;
    var fiberStrandId = feature2.f.id

    var isupwardRoute = feature2.getProperty("isUpwardRoute");
    var isSelected = feature2.getProperty("isSelected");

    if (fiberStrandId) {
      var upwardRouteFeatures = fiberGraphForPlan.getBranchFromEdge(fiberStrandId)
      clearUpwardPath();

      upwardRouteFeatures.forEach((feature) => {
        feature.properties.isSelected = fiberStrandId == feature.properties.id;
        $scope.upwardRouteLayer.data_layer.addGeoJson(feature)
      })
      $scope.upwardRouteLayer.show()
      $rootScope.$broadcast("fiber_strand_selected" , feature2);
    }
  })




  function clearUpwardPath() {
    $scope.upwardRouteLayer.clearData();
    $scope.upwardRouteLayer.hide()
  }

  $rootScope.$on('map_layer_mouseover_feature', (event, args) => {
    var feature2 = args.feature;
    var fiberStrandId = feature2.f.id

    $scope.hoverLayer.clearData();

    if(fiberStrandId){
      var feature = fiberGraphForPlan.getEdge(fiberStrandId).getFeature();
      $scope.hoverLayer.data_layer.addGeoJson(feature)
      $scope.hoverLayer.show();
    }

    var points = fromLatLngToPoint(args.latLng);
    $(".infobox").css("top" , points.y + 70).css("left" , points.x).text(feature2.f.fiber_strands);
    $(".infobox").show();
  })

  function fromLatLngToPoint(latLng) {
    var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
    var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
    var scale = Math.pow(2, map.getZoom());
    var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
    return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
  }

  $rootScope.$on('map_layer_mouseout_feature', (event, args) => {
    $scope.hoverLayer.clearData();
    $(".infobox").hide();
  })

  $rootScope.$on("fiber_segment_dialog_closed" , function () {
    $scope.upwardRouteLayer.clearData();
  });


  const ROUTE_LAYER_NAME = 'Route'
  function configureServiceLayer (layer) {
    layer.showFeederFiber = false
    layer.showDistributionFiber = false
    layer.showBackhaulFiber = false
    layer.enabled = true

    var routeLayer = new MapLayer({
      short_name: 'RT',
      name: ROUTE_LAYER_NAME,
      type: 'route',
      style_options: {
        normal: {
          strokeColor: 'red'
        }
      },
      highlighteable: true,
      api_endpoint: `/network/fiber/:plan_id/find/${layer.id}`,
      declarativeStyles: routeStyles(layer),
      threshold: 0,
      reload: 'always'
    })
    layer.routeLayer = routeLayer

    layer.changedFiberVisibility = () => {
      state.showFeederFiber = layer.showFeederFiber
      state.showDistributionFiber = layer.showDistributionFiber
      state.showBackhaulFiber = layer.showBackhaulFiber

      routeLayer.setVisible(layer.enabled && (layer.showFeederFiber || layer.showDistributionFiber || layer.showBackhaulFiber))
      routeLayer.setDeclarativeStyle(routeStyles(layer))
    }

    var networkNodesLayer = new MapLayer({
      type: 'network_nodes',
      name: 'Network Nodes',
      short_name: 'NN',
      style_options: {
        normal: {
          fillColor: 'brown',
          strokeWeight: 1,
          opacity: 0.8,
          visible: true
        },
        selected: {
          visible: true
        }
      },
      threshold: 12,
      reload: 'always',
      scaleIcon : true,
      declarativeStyles: (feature, styles) => {
        var zoom  = map.getZoom();
        var pos = feature.getGeometry("coordinates").get("Point")
        var scale = getScale(pos ,zoom)
        var name = feature.getProperty('name')
        var iconW = 30 / scale;

         if(zoom > 16){
             iconW = 35
         }

        if (name) {
          styles.icon = {
            anchor: new google.maps.Point(iconW /2, iconW/2),
            url: `/images/map_icons/${config.ARO_CLIENT}/composite/${layer.name}_${name}.png`,
            scaledSize:  new google.maps.Size(iconW, iconW)
          }
        } else {
          styles.icon = { path: 0, scale: 3, strokeColor: 'brown' }
        }
      }
    })

    function getScale(latLng,zoom){
        //https://gis.stackexchange.com/questions/108763/how-to-calculate-pixels-per-meter-ratio-according-to-google-or-bing-map-zoom-le
        return 156543.03392 * Math.cos(latLng.lat() * Math.PI / 180) / Math.pow(2, zoom)
    }

    networkNodesLayer.flat_color = true
    layer.networkNodesLayer = networkNodesLayer

    layer.changeNodeTypesVisibility = () => {
      var types = []
      layer.nodeTypes.forEach((nodeType) => {
        if (nodeType.visible) {
          types.push(nodeType.id)
        }
      })
      if (types.length === 0 || layer.id === 'user_defined') {
        networkNodesLayer.hide()
      } else {
        networkNodesLayer.threshold = types.length === 1 && types[0] === 1 ? 8 : 12
        networkNodesLayer.show()
        var url = `/network/nodes${$scope.plan ? '/'+$scope.plan.id : ''}/find/${layer.id}`
        networkNodesLayer.setApiEndpoint(url, {
          node_types: types.join(',')
        })
      }
    }
    layer.changedAvailability = function () {
      networkNodesLayer.setVisible(layer.enabled)
      layer.changedFiberVisibility()
    }
    layer.changedAvailability()

    var coverageLayer = new MapLayer({
      type: 'wireless_coverage',
      name: 'Wireless Coverage',
      short_name: 'FWC',
      style_options: {
        normal: {
          fillColor: 'green',
          strokeWeight: 1,
          opacity: 0.8,
          visible: true
        },
        selected: {
          visible: true
        }
      },
      threshold: 12,
      reload: 'always',
      declarativeStyles: (feature, styles) => {
        var name = feature.getProperty('name')
        if (name) {
          styles.icon = {
            anchor: new google.maps.Point(15, 15),
            url: `/images/map_icons/${config.ARO_CLIENT}/composite/${layer.name}_${name}.png`
          }
        } else {
          styles.icon = { path: 0, scale: 3, strokeColor: 'green' }
        }
      }
    })
    coverageLayer.flat_color = true
    coverageLayer.is_coverage = true;
    layer.fixedWirelessCoverage = coverageLayer

    layer.fixedWirelessVisibilityChanged = () => {
        var types = []
        layer.nodeTypes.forEach((nodeType) => {
          if (nodeType.coverage_visible) {
            types.push(nodeType.id)
          }
        })
        if (types.length === 0 || layer.id === 'user_defined') {
        	coverageLayer.hide()
        } else {
          coverageLayer.threshold = types.length === 1 && types[0] === 1 ? 8 : 12
          coverageLayer.show()
          coverageLayer.setApiEndpoint(`/network/nodes/:plan_id/find/${layer.id}`, {
            node_types: types.join(',')
          })
        }
      }
    
    layer.changedWirelessCoverageAvailability = function () {
    	coverageLayer.setVisible(layer.enabled)
    }
    layer.changedWirelessCoverageAvailability()
  }

  function emptyChanges () {
    return { insertions: [], deletions: [], updates: [] }
  }

  var changes = emptyChanges()

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    if (!plan) {
      $scope.serviceLayers.forEach((layer) => {
        layer.networkNodesLayer.clearData()
        layer.routeLayer.clearData()
        layer.fixedWirelessCoverage.clearData()
      })
      return
    }

    map.ready(() => {
      // fiberPlantLayer.show() // hidden by default
      $scope.serviceLayers.forEach((layer) => {
        layer.networkNodesLayer.reloadData()
        layer.routeLayer.reloadData()
        layer.fixedWirelessCoverage.reloadData()
      })
    })

    $http.get('/network_plan/' + plan.id).then((response) => {
      redrawRoute(response.data)
    })
    reloadDatasources()
  })

  $rootScope.$on('plan_cleared', () => {
    $scope.serviceLayers.forEach((layer) => {
      layer.networkNodesLayer.reloadData()
      layer.routeLayer.clearData()
      layer.fixedWirelessCoverage.clearData()
    })

    clearUpwardPath();
    $scope.hoverLayer.clearData();
  })

  $scope.save_nodes = () => {
    $http.post('/network/nodes/' + $scope.plan.id + '/edit', changes).then((response) => {
      if (changes.insertions.length > 0 || changes.deletions.length > 0) {
        // For insertions we need to get the ids so they can be selected
        $scope.serviceLayers.forEach((layer) => {
          layer.networkNodesLayer.reloadData()
          layer.fixedWirelessCoverage.reloadData()
        })
      }
      changes = emptyChanges()
      $rootScope.$broadcast('equipment_nodes_changed')
    })
  }

  $scope.place_random_equipment = () => {
    var gm_event = {
      latLng: new google.maps.LatLng(40.77682494132765, -73.95257949829102)
    }
    $scope.selected_tool = $scope.build_node_types[0].name
    $rootScope.$broadcast('map_click', gm_event)
  }

  $rootScope.$on('map_layer_dragged_feature', (e, gm_event, feature) => {
    var coordinates = feature.getGeometry().get()
    changes.updates.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      id: feature.getProperty('id')
    })
    $scope.save_nodes()
  })

  $rootScope.$on('map_click', (e, gm_event) => {
    if (!map_tools.is_visible('network_nodes') || !$scope.plan || !$scope.selected_tool) return

    var type = $scope.selected_tool
    var coordinates = gm_event.latLng
    var feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [ coordinates.lng(), coordinates.lat() ]
      }
    }
    changes.insertions.push({
      lat: coordinates.lat(),
      lon: coordinates.lng(),
      type: _.findWhere(viewNodeTypes, { name: type }).id
    })
    var networkNodesLayer = $scope.serviceLayers[0].networkNodesLayer // TODO: use selected layer
    var dataLayer = networkNodesLayer.data_layer
    var arr = dataLayer.addGeoJson(feature)
    arr.forEach((feature) => {
      dataLayer.overrideStyle(feature, {
        icon: `/images/map_icons/${config.ARO_CLIENT}/${type}.png`,
        draggable: true
      })
    })
    networkNodesLayer.show()
    $scope.save_nodes()
  })

  $rootScope.$on('contextual_menu_feature', (event, options, map_layer, feature) => {
    if (map_layer.type !== 'network_nodes' ||
      !map_tools.is_visible('network_nodes') ||
      !feature.getProperty('unselectable') ||
      $scope.plan.owner_id !== user_id) {
      return
    }
    options.add('Delete equipment node', (map_layer, feature) => {
      swal({
        title: 'Are you sure?',
        text: 'You will not be able to recover the deleted data!',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        showCancelButton: true,
        closeOnConfirm: true
      }, () => {
        changes.deletions.push({
          id: feature.getProperty('id')
        })
        $scope.save_nodes()
      })
    })
  })

  $scope.vztfttpChanged = () => {
    Object.keys($scope.equipment_layers).forEach((key) => {
      var layer = $scope.equipment_layers[key]
      layer.setVisible($scope.vztfttp)
    })
  }

  $rootScope.$on('equipment_nodes_changed', () => {
    $http.get('/network_plan/' + $scope.plan.id + '/metadata').then((response) => {
      redrawRoute(response.data, true)
    })
  })

  $rootScope.$on('route_planning_changed', () => {
    $http.get('/network_plan/' + $scope.plan.id).then((response) => {
      redrawRoute(response.data, false)
    })
  })

  $rootScope.$on('route_planning_changed', (e, response) => {
    redrawRoute(response)
  })

  function routeStyles (serviceLayer) {
    return (feature, styles) => {
      var type = feature.getProperty('fiber_type')
      styles.zIndex = MapLayer.Z_INDEX_FIBER_STRANDS
      if (type === 'feeder') {
        styles.strokeColor = 'blue'
        styles.strokeWeight = calcFiberScale(feature , "feeder" , 4);
        if (!serviceLayer.showFeederFiber) {
          styles.visible = false
        }
      } else if (type === 'distribution') {
        styles.strokeColor = 'red'
        styles.strokeWeight = calcFiberScale(feature , "dist" , 2);
        if (!serviceLayer.showDistributionFiber) {
          styles.visible = false
        }
      } else if (type === 'backbone') {
        styles.strokeColor = 'black'
        styles.strokeWeight = 4
        if (!serviceLayer.showBackhaulFiber) {
          styles.visible = false
        }
      }
    }
  }

  function calcFiberScale(feature , fiber_type , defscale) {
    var currOption = state.selected_fiber_option;
    if(currOption.id == 1){
      return defscale
    }else {
      var optionValue = feature.f[currOption.field];

      var width = 0;
      var maxPixelWidth = +currOption.pixelWidth.max;
      var minPixelWidth = +currOption.pixelWidth.min;

      var exponent =  +currOption.pixelWidth.divisor; // 1/3 Currently
      var atomicDivisor =  +currOption.pixelWidth.atomicDivisor; //50 Currently

      switch (currOption.field){
         case "fiber_strands": width = Math.min(Math.pow(optionValue , (exponent)) , 12);
              break;
         case "atomic_units" : width = Math.min(Math.pow((optionValue / atomicDivisor + 1) , (exponent)) , 12);
              break;
       }

       return (width / 12) * (maxPixelWidth -  minPixelWidth) +  minPixelWidth - 1.
    }
  }

  function redrawRoute (data, only_metadata) {
    if ($scope.plan && data.metadata) {
      $scope.plan.metadata = data.metadata
      $rootScope.$broadcast('plan_changed_metadata', $scope.plan)
    }
    if (only_metadata) return
    $scope.serviceLayers.forEach((layer) => {
      layer.routeLayer.reloadData()
    })

    // to calculate market size
    $rootScope.$broadcast('route_changed')
  }

  // prevent accordions from changing the URL
  var accordion = $('#serviceLayersAccordion')
  accordion.on('click', '[data-parent="#serviceLayersAccordion"]', (e) => {
    e.preventDefault()
  })

  $scope.showingDatasources = []
  $scope.remainingDatasources = []

  var fiberLayers = []
  function reloadDatasources () {

    // Remove older fiber layers (if any)
    fiberLayers.forEach((fiberLayer) => {
      fiberLayer.hide()     // Without this, data will be reloaded on map events. Needs to be fixed in map_layer.js.
      fiberLayer.remove()
    })
    fiberLayers = []

    clearUpwardPath();
    $scope.hoverLayer.clearData();

    $http.get('/user_fiber/list').then((response) => {
      $scope.remainingDatasources = []
      response.data.map(function (ds) {
        $scope.remainingDatasources.push(ds);
      })
      //load existing fibers to fiberLayer
      $scope.existingFibers.map(function (fib) {
        $http.get('/fiberSourceIdOfExistingFiber/' + fib.name)
          .then((response2) => {
            var fiberSystemId = response2.data[0].id
            $scope.remainingDatasources.push({
              systemId : fiberSystemId,
              name : fib.name
            })
          fiberLayers[fiberSystemId] = fib;
        })
          .catch((error) => console.log(error))
      })

      response.data.forEach(initDatasource)
      updateOptimizationFiber()
    })
  }

  function initDatasource (datasource) {
    var key = String(datasource.systemId)
    var layer = fiberLayers[key]
    if (layer) return
    layer = new MapLayer({
      name: datasource.text,
      type: 'fiber_plant',
      short_name: 'F',
      api_endpoint: `/network/fiber_plant/datasource/${datasource.systemId}`,
      style_options: {
        normal: {
          strokeColor: config.ui.colors.fiber,
          strokeWeight: 2,
          fillColor: config.ui.colors.fiber
        }
      },
      threshold: 0,
      reload: 'always'
    })
    fiberLayers[key] = layer
    datasource.layer = layer
    datasource.visible = false
    datasource.toggleVisibility = () => {
      layer.toggleVisibility()
      datasource.visible = layer.visible
      updateOptimizationFiber()
    }
  }

  $rootScope.$on('uploaded_fiber', (e, info) => {
    initDatasource(info)
    info.toggleVisibility()
    reloadDatasources();
  })

  // Additional variable required ($scope.fibers.selectedFibers) because ui-select creates a new scope via ng-repeat
  $scope.fibers = { selectedFibers: [] }
  $scope.selectedFibersChanged = () => {
    // Set visibility of fiber layers
    fiberLayers.forEach((fiberLayer) => fiberLayer.hide())
    $scope.fibers.selectedFibers.forEach((selectedFiber) => fiberLayers[selectedFiber.systemId].show())

    // For now, save fiber source ids in state.js. Later we should store everything in state.js
    state.optimizationOptions.fiberSourceIds = _.pluck($scope.fibers.selectedFibers, 'systemId').sort()
  }

  $scope.selectedExistingFiberIds = []    // For now, save fiber source ids in state.js. Later we should store everything in state.js

  $scope.addFiber = () => {
    $('#upload_fiber_modal').modal('show')
  }

  $scope.$on("map_loaded" , ()=>{
    reloadDatasources();
  })

  $scope.$on("map_setting_changed" , (e , settings)=>{
     if(settings.type == "fiber_option"){
       reloadFiberStyles();
     }
  })
}])