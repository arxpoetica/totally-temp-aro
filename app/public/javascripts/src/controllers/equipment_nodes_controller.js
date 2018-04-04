/* global app user_id config map _ google swal config $ globalServiceLayers globalExistingFiberSourceNames */
// Equipment Nodes Controller
app.controller('equipment_nodes_controller', ['$scope', '$rootScope', '$http', '$location', 'map_tools', 'MapLayer', '$timeout', 'optimization', 'state', 'fiberGraph', ($scope, $rootScope, $http, $location, map_tools, MapLayer, $timeout, optimization, state, fiberGraph) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.user_id = user_id
  $scope.ARO_CLIENT = config.ARO_CLIENT

  $scope.selected_tool = null
  $scope.vztfttp = true
  $scope.planState = state;

  // Get the point transformation mode with the current zoom level
  var getPointTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
  }

  // Get the line transformation mode with the current zoom level
  var getLineTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth_absolute'
  }

  // Get the polygon transformation mode with the current zoom level
  var getPolygonTransformForLayer = (zoomThreshold) => {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
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

    // Only add planned equipment if we have a valid plan selected
    var planId = state.plan && state.plan.getValue() && state.plan.getValue().id
    if (planId) {

      var networkLayers = _.find(state.networkEquipments,(category) => category.key == "planned" ).layers
      var site_boundaries = _.find(networkLayers,(layer) => layer.label == "Site Boundaries")
      
      // Loop through all network equipment categories (e.g. "Existing Equipment")
      state.networkEquipments.forEach((category) => {

        // Loop through all the layers in this category
        category.layers.forEach((networkEquipment) => {
          if (networkEquipment.checked && networkEquipment.tileUrl.indexOf('{libraryId}') < 0) {
            var tileUrl = networkEquipment.tileUrl.replace('{rootPlanId}', planId)
            if (networkEquipment.equipmentType === 'point') {
              var pointTransform = getPointTransformForLayer(+networkEquipment.aggregateZoomThreshold)
              tileUrl = tileUrl.replace('{pointTransform}', pointTransform)
            } else if (networkEquipment.equipmentType === 'line') {
              var lineTransform = getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
              tileUrl = tileUrl.replace('{lineTransform}', lineTransform)
            } else if (networkEquipment.equipmentType === 'polygon') {
              var polygonTransform = getPolygonTransformForLayer(+networkEquipment.aggregateZoomThreshold)
              tileUrl = tileUrl.replace('{polyTransform}', polygonTransform)
            }
            oldMapLayers[networkEquipment.key] = {
              dataUrls: [tileUrl],
              iconUrl: networkEquipment.iconUrl,
              renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
              strokeStyle: networkEquipment.drawingOptions.strokeStyle,
              lineWidth: 2,
              fillStyle: networkEquipment.drawingOptions.fillStyle,
              opacity: 0.5,
              selectable: true,
              showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && state.showDirectedCable //Showing Direction
            }

            createdMapLayerKeys.add(networkEquipment.key)
          } else if (networkEquipment.checked && networkEquipment.tileUrl.indexOf('{libraryId}') >= 0
                     && state.dataItems.fiber){
            var EXISTING_FIBER_PREFIX = 'map_layer_existing_'
            var lineTransform = getLineTransformForLayer(+state.existingFiberOptions.aggregateZoomThreshold)
            var tileUrl = networkEquipment.tileUrl.replace('{lineTransform}', lineTransform)
            state.dataItems.fiber.selectedLibraryItems.forEach((selectedLibraryItem) => {
              var mapLayerKey = `${EXISTING_FIBER_PREFIX}${selectedLibraryItem.identifier}`
              tileUrl = tileUrl.replace('{libraryId}', selectedLibraryItem.identifier)
              oldMapLayers[mapLayerKey] = {
                dataUrls: [tileUrl],
                iconUrl: networkEquipment.iconUrl, // Hack because we need some icon
                renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
                strokeStyle: networkEquipment.drawingOptions.strokeStyle,
                lineWidth: 2,
                fillStyle: networkEquipment.drawingOptions.fillStyle,
                showPolylineDirection: networkEquipment.drawingOptions.showPolylineDirection && state.showDirectedCable //Showing Direction for copper cable
              }
              createdMapLayerKeys.add(mapLayerKey)
            })
          }
        })
        if (state.showSiteBoundary) {
          category.layers.forEach((networkEquipment) => {
            if(networkEquipment.checked && networkEquipment.networkNodeType) {
              var planned_site_boundaries = angular.copy(site_boundaries)
              var boundaryType = _.find(state.networkNodeTypes,(node) => {
                if(node.name == networkEquipment.networkNodeType)
                  return node
              })
              var pointTransform = getPointTransformForLayer(+planned_site_boundaries.aggregateZoomThreshold)
              
              planned_site_boundaries.tileUrl = planned_site_boundaries.tileUrl.replace('{rootPlanId}', planId)
              planned_site_boundaries.tileUrl = planned_site_boundaries.tileUrl.replace('{boundaryTypeId}', state.selectedBoundaryType.id)
              planned_site_boundaries.tileUrl = planned_site_boundaries.tileUrl.replace('{pointTransform}', pointTransform)

              oldMapLayers["planned_site_boundaries_"+networkEquipment.networkNodeType] = {
                dataUrls: [planned_site_boundaries.tileUrl],
                iconUrl: planned_site_boundaries.iconUrl,
                renderMode: 'PRIMITIVE_FEATURES',   // Always render equipment nodes as primitives
                strokeStyle: planned_site_boundaries.drawingOptions.strokeStyle,
                lineWidth: 2,
                fillStyle: planned_site_boundaries.drawingOptions.fillStyle,
                opacity: 0.5,
                selectable: true,
                showPolylineDirection: planned_site_boundaries.drawingOptions.showPolylineDirection
              }

              createdMapLayerKeys.add("planned_site_boundaries_"+networkEquipment.networkNodeType)
            }
          })
        }  
      })
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    state.mapLayers.next(oldMapLayers)
  }
  // When the map zoom changes, map layers can change
  $rootScope.$on('map_zoom_changed', updateMapLayers)

  // Change the visibility of a network equipment layer. layerObj should refer to an object
  // in state.js --> networkEquipments[x].layers
  $scope.changeLayerVisibility = (layerObj, isVisible) => {
    layerObj.checked = isVisible
    updateMapLayers()
  }

  // Create a new set of map layers
  state.appReadyPromise.then(() => {
    updateMapLayers()
  })

  // Update map layers when the dataItems property of state changes
  state.dataItemsChanged
    .subscribe((newValue) => updateMapLayers())

  // Update map layers when the dataItems property of state changes
  state.viewSettingsChanged
  .subscribe(() => updateMapLayers())

  const ROUTE_LAYER_NAME = 'Route'
  function configureServiceLayer (layer) {
    layer.showFeederFiber = false
    layer.showDistributionFiber = false
    layer.showBackhaulFiber = false
    layer.enabled = true

    // Limit the number of segments we receive from the server. It takes a long time to
    // display segments, especially when they have different widths and opacity. Also,
    // each fiber segment takes 70 bytes zipped to transfer from the server.
    // So 1000 segments = approx 70 kb zipped
    var maxFiberSegments = 3000

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
      api_endpoint: `/network/fiber/:plan_id/find/${layer.id}/${maxFiberSegments}`,
      declarativeStyles: routeStyles(layer),
      threshold: 0,
      reload: 'always',
      onDataLoaded:(data)=>{
        if(data.api_endpoint == `/network/fiber/:plan_id/find/all/${maxFiberSegments}`){
          $scope.fiberOverlay = data;
          //calculate opacity here
          $scope.calcFiberScale();
          $scope.calcStrokeOpacity();
        }
      }
    })

    $scope.calcStrokeOpacity = function () {
      var currOption = state.viewSetting.selectedFiberOption;
      if (currOption.id === state.viewFiberOptions[0].id) {
        $scope.fiberOverlay.features.map(function (feature) {
          feature.setProperty("opacity", 1);
        })
      } else {
        var ll = +currOption.opacity.min;
        var ul = +currOption.opacity.max;
        var min = _.min($scope.fiberOverlay.features, (o) => { return o.getProperty("width") }).getProperty("width");
        var max = _.max($scope.fiberOverlay.features, (o) => { return o.getProperty("width") }).getProperty("width");

        $scope.fiberOverlay.features.map(function (feature) {
          var math = (ul - ll) * (((feature.getProperty("width") - min) / (max - min))) + ll
          feature.setProperty("opacity", math);
        })
      }
    }

    $scope.calcFiberScale = function () {
      // return  // This causes the browser to hang
        var currOption = state.viewSetting.selectedFiberOption;
        if (currOption.id === state.viewFiberOptions[0].id) {
          var featuresBucket = _.groupBy($scope.fiberOverlay.features,function(feature) { return feature.getProperty("fiber_type") } )	
          var featuresBucketKeys = _.keys(featuresBucket)
          _.each(featuresBucketKeys, function (key) {
            if (key == 'distribution') {
              _.each(featuresBucket[key], function (feature) { feature.setProperty("width", 2) })
            } else {
              _.each(featuresBucket[key], function (feature) { feature.setProperty("width", 4) })
            }
          })
        } else {
          $scope.fiberOverlay.features.map(function (feature) {
	        var optionValue = feature.f[currOption.field];
	
	        var width = 0;
	        var maxPixelWidth = +currOption.pixelWidth.max
	        var minPixelWidth = +currOption.pixelWidth.min
	
	        var exponent = +currOption.pixelWidth.divisor // 1/3 Currently
	        var atomicDivisor = +currOption.pixelWidth.atomicDivisor; //50 Currently
	
	        switch (currOption.field) {
	          case "fiber_strands": width = Math.min(Math.pow(optionValue, (exponent)), maxPixelWidth)
	            break;
	          case "atomic_units": width = Math.min(Math.pow((optionValue / atomicDivisor + 1), (exponent)), maxPixelWidth)
	            break;
	        }
	
	        var aw = (width / maxPixelWidth) * (maxPixelWidth - minPixelWidth) + minPixelWidth - 1
	        feature.setProperty("width", aw);
          })
        }
    }

    layer.routeLayer = routeLayer

    layer.changedFiberVisibility = () => {
      state.showFeederFiber = layer.showFeederFiber
      state.showDistributionFiber = layer.showDistributionFiber
      state.showBackhaulFiber = layer.showBackhaulFiber

      routeLayer.setVisible(layer.enabled && (layer.showFeederFiber || layer.showDistributionFiber || layer.showBackhaulFiber))
      routeLayer.setDeclarativeStyle(routeStyles(layer))
    }
  }
}])