/* global app _ config user_id $ map google randomColor tinycolor Chart swal */
// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', 'configuration', 'map_tools', 'map_layers', 'MapLayer', 'CustomOverlay', 'tracker', 'optimization', 'state', ($scope, $rootScope, $http, configuration, map_tools, map_layers, MapLayer, CustomOverlay, tracker, optimization, state) => {
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

  $rootScope.$on('configuration_loaded', () => {
    $scope.defineGetterSetters()
  })

  // Define getter setters (put this in a function as it is called after configuration has been loaded)
  $scope.defineGetterSetters = () => {
    // This function is a getter (when newValue is undefined) and setter (when newValue is defined)
    // for determining which location types to show (and optimize)
    var useGlobalLocationType = (locationType, optimizationOptions, newValue) => {
      if (typeof newValue === 'undefined') {
        // Function is called as a getter. Return true if the location type exists in the array of selected locationTypes
        return optimizationOptions
              && optimizationOptions.locationTypes
              && optimizationOptions.locationTypes.indexOf(locationType) >= 0
      } else {
        // Function is called as a setter

        var indexOfLocationType = optimizationOptions.locationTypes.indexOf(locationType)
        if (newValue) {
          // Add the global data source to the array if it doesn't already exist
          if (indexOfLocationType < 0) {
            optimizationOptions.locationTypes.push(locationType)
          }
        } else {
          // Remove the global data source to the array if it exists in the array
          if (indexOfLocationType >= 0) {
            optimizationOptions.locationTypes.splice(indexOfLocationType, 1)
          }
        }
      }
    }

    // Define getter/setter functions for different location types. All data is stored to/from $scope.planState.optimizationOptions
    $scope.getSetLocationTypes = {
      household: (value) => { return useGlobalLocationType('household', $scope.planState.optimizationOptions, value) },
      celltower: (value) => { return useGlobalLocationType('celltower', $scope.planState.optimizationOptions, value) }
    }
    // For businesses, add a getter/setter for each business size
    $scope.planState.allLocationTypes.forEach((locationType) => {
      $scope.getSetLocationTypes[locationType.key] =
        (value) => { return useGlobalLocationType(locationType.key, $scope.planState.optimizationOptions, value) }
    })

    // This function is a getter (when newValue is undefined) and setter (when newValue is defined)
    // for determining whether we use a particular data source in optimization
    var useGlobalDataSource = (locationType, optimizationOptions, newValue) => {
      if (typeof newValue === 'undefined') {
        // Function is called as a getter. Return true if the global datasource ID exists in the array of datasource ids for this locationType
        return optimizationOptions
              && optimizationOptions.locationDataSources
              && optimizationOptions.locationDataSources[locationType]
              && optimizationOptions.locationDataSources[locationType].indexOf($scope.planState.GLOBAL_DATASOURCE_ID) >= 0
      } else {
        // Function is called as a setter
        // Make sure that we have an array for this locationType in optimization options
        if (!optimizationOptions.locationDataSources[locationType]) {
          optimizationOptions.locationDataSources[locationType] = []
        }

        var indexOfGlobalDataSourceId = optimizationOptions.locationDataSources[locationType].indexOf($scope.planState.GLOBAL_DATASOURCE_ID)
        if (newValue) {
          // Add the global data source to the array if it doesn't already exist
          if (indexOfGlobalDataSourceId < 0) {
            optimizationOptions.locationDataSources[locationType].push($scope.planState.GLOBAL_DATASOURCE_ID)
          }
        } else {
          // Remove the global data source to the array if it exists in the array
          if (indexOfGlobalDataSourceId >= 0) {
            optimizationOptions.locationDataSources[locationType].splice(indexOfGlobalDataSourceId, 1)
          }
        }
      }
    }

    // Define getter/setter functions for different business categories. All data is stored to/from $scope.planState.optimizationOptions
    $scope.getSetDataSources = {
      businesses: (value) => { return useGlobalDataSource('business', $scope.planState.optimizationOptions, value) },
      households: (value) => { return useGlobalDataSource('household', $scope.planState.optimizationOptions, value) },
      towers: (value) => { return useGlobalDataSource('celltower', $scope.planState.optimizationOptions, value) }
    }
  }

  $scope.overlay = 'none'
  $scope.heatmapVisible = false
  $scope.heatmapOn = true
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

  $scope.available_tools = _.reject($scope.available_tools, (tool) => {
    return config.ui.map_tools.locations.build.indexOf(tool.key) === -1
  })

  // The state.locations object will be updated after the configuration is loaded
  $scope.planState = state;

  $scope.user_id = user_id

  $scope.show_commercial = config.ui.map_tools.locations.view.indexOf('commercial') >= 0
  $scope.show_residential = config.ui.map_tools.locations.view.indexOf('residential') >= 0

  $scope.show_businesses =  $scope.show_commercial
  $scope.show_households = $scope.show_residential
  $scope.show_towers = false
  $scope.new_location_data = null
  $scope.industries = []
  $scope.business_categories_selected = {}
  $scope.household_categories_selected = {}
  $scope.households_description = ''

  var uploadedCustomersSelect = $('.uploadedCustomersSelect')

  var locationStyles = {
    normal: {
      visible: true,
      fillColor: 'white',
      strokeColor: 'red',
      strokeWeight: 1,
      fillOpacity: 0.7
    },
    selected: {
      visible: true,
      fillColor: '#78D8C3',
      strokeColor: '#78D8C3',
      strokeWeight: 1,
      fillOpacity: 0.9
    }
  }

  var declarativeStyles = (feature, styles) => {
    // NOTE: Even if configuration.locationCategories.mapIconFolder is not defined at this point,
    //       every time we call map layer show/hide, it calls this function.
    if (styles.icon) return
    var type = 'households'
    var target = feature.getProperty('selected')
    if (target) {
      styles.icon = configuration.locationCategories.mapIconFolder + 'target.png'
      return
    }
    var categories = feature.getProperty('entity_categories')
    if (categories.indexOf('towers') >= 0) {
      styles.icon = configuration.locationCategories.mapIconFolder + 'tower.png'
      return
    }
    var order = [
      'b_small', 'b_medium', 'b_large', 'b_uploaded'
    ]
    var largestCategory = null
    var largestIndex = -1
    if (Array.isArray(categories)) {
      categories.forEach((category) => {
        if (category.indexOf('b_') === 0) type = 'businesses'
        var index = order.indexOf(category)
        if (index > largestIndex) {
          largestIndex = index
          largestCategory = category
        }
      })
    }
    var selected = feature.getProperty('selected') ? 'selected' : 'default'
    if (largestCategory) {
      styles.icon = configuration.locationCategories.mapIconFolder + `${type}_${largestCategory.substring(2)}_${selected}.png`
    } else {
      styles.icon = configuration.locationCategories.mapIconFolder + `${type}_${selected}.png`
    }
  }

  var locationsLayer = $scope.locations_layer = new MapLayer({
    type: 'locations',
    name: 'Locations',
    short_name: 'L',
    api_endpoint: '/locations/:plan_id',
    style_options: locationStyles,
    threshold: 15,
    reload: 'always',
    heatmap: true,
    declarativeStyles: declarativeStyles
  })

  var selectedLocationsLayer = $scope.selected_locations_layer = new MapLayer({
    type: 'selected_locations',
    changes: 'locations',
    name: 'Selected locations',
    short_name: 'SL',
    api_endpoint: '/locations/:plan_id/selected',
    style_options: locationStyles,
    // threshold: 15,
    reload: 'always',
    declarativeStyles: declarativeStyles
  })

  var customerProfileLayer = new MapLayer({
    type: 'locations_customer_profile_density',
    api_endpoint: '/locations_customer_profile_density',
    style_options: {
      normal: {
        strokeColor: 'blue',
        strokeWeight: 2,
        fillColor: 'blue'
      }
    },
    threshold: 100,
    reload: 'always'
  })

  map_layers.addFeatureLayer(locationsLayer)
  map_layers.addFeatureLayer(selectedLocationsLayer)
  map_layers.addFeatureLayer(customerProfileLayer)

  $scope.changeLocationsLayer = (majorCategory) => {
    tracker.track('Locations / ' + $scope.overlay)
    customerProfileLayer.setVisible($scope.overlay === 'customer_profile')

    // Select the business categories
    var business_categories = []
    $scope.planState.allLocationTypes.forEach((locationType) => {
      if ((locationType.type === 'business') && (locationType.checked)) {
        business_categories.push(locationType.key)
      }
    })

    // Set the selected options in the API endpoint that will show locations in the layer
    var options = {
      business_categories: business_categories,
      household_categories: [],
      towers: [],
      dataSources: [1]
    }
    locationsLayer.setApiEndpoint('/locations/:plan_id', options)
    locationsLayer.show()
  }

  $('#create-location').on('shown.bs.modal', () => {
    $('#create-location select').val('').trigger('change')
  })

  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (tool === 'locations') {
      $scope.changeLocationsLayer()
      if (!map_tools.is_visible('locations')) {
        $scope.selected_tool = null
        map.setOptions({ draggableCursor: null })
      }
    }
  })

  $scope.create_location = () => {
    $http.post('/locations/create', $scope.new_location_data)
      .success((response) => {
        $('#create-location').modal('hide')
        $scope.new_location_data = {}
        locationsLayer.data_layer.addGeoJson(response)
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
      .success((response) => {
        var results = response.results
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

  $scope.datasources = []
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    if (!$scope.heatmapOn) $scope.toggleHeatmap()
    $scope.datasources = []
    optimization.datasources = []

    // unselect all entity types
    $scope.show_towers = false
    $scope.show_businesses = true
    $scope.show_households = false
    $scope.business_categories_selected = {}
    $scope.household_categories_selected = {}

    if (plan) {
      plan.location_types = plan.location_types || []
      map.ready(() => {
        selectedLocationsLayer.show()
        selectedLocationsLayer.reloadData()
        // select entity types used in optimization
        selectLocations(plan.location_types)
      })
    }

    uploadedCustomersSelect.select2('val', [])
    $scope.changeLocationsLayer()
    reloadDatasources()
  })

  function reloadDatasources (callback) {
    $http.get('/datasources').success((response) => {
      $scope.datasources = response
      uploadedCustomersSelect.select2({
        placeholder: 'Select one or more datasets',
        escapeMarkup: (m) => m,
        data: response.map((item) => ({ id: item.dataSourceId, text: item.name })),
        multiple: true
      })
      callback && callback(response)
    })
  }

  $rootScope.$on('uploaded_customers', (e, info) => {
    reloadDatasources((response) => {
      var dataset = response.find((item) => item.id === info.id)
      if (!dataset) return
      var val = uploadedCustomersSelect.select2('val')
      val.push(String(dataset.dataSourceId))
      uploadedCustomersSelect.select2('val', val, true)
    })
  })

  $rootScope.$on('select_locations', (e, locationTypes) => {
    selectLocations(locationTypes)
  })

  function selectLocations (locationTypes) {
    var businessTypes = {
      medium: 'medium',
      large: 'large',
      small: 'small',
      mrcgte2000: '2kplus'
    }
    Object.keys(businessTypes).forEach((type) => {
      $scope.business_categories_selected[businessTypes[type]] = locationTypes.indexOf(type) >= 0
    })
    $scope.show_towers = locationTypes.indexOf('celltower') >= 0
    $scope.show_households = locationTypes.indexOf('household') >= 0
    //$scope.show_businesses = Object.keys($scope.business_categories_selected).reduce((total, item) => total || $scope.business_categories_selected[item], false)
    $scope.changeLocationsLayer()
  }

  $scope.overlay_is_loading = () => {
    return customerProfileLayer.is_loading
  }

  var overlays = []
  $http.get('/customer_profile/all_cities')
    .success((response) => {
      overlays = response.map((city) => {
        var id = 'customer_profile_' + city.id
        var chart = document.createElement('canvas')
        chart.setAttribute('id', id)
        chart.style.width = '100%'
        chart.style.height = '100%'

        var width = 150
        var height = 150
        var coordinates = city.centroid.coordinates
        var latLng = new google.maps.LatLng(coordinates[1], coordinates[0])
        return new CustomOverlay(map, chart, width, height, latLng, () => {
          var colors = randomColor({ seed: 1, count: city.customer_profile.customer_types.length })
          var data = city.customer_profile.customer_types.map((customer_type) => {
            var color = colors.shift()
            return {
              name: customer_type.name,
              label: customer_type.name,
              value: (customer_type.businesses + customer_type.households) * 100 / city.customer_profile.customers_businesses_total,
              color: color,
              highlight: tinycolor(color).lighten().toString()
            }
          })

          // chart && chart.destroy();
          var options = {
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= angular.injector(['ng']).get('$filter')('number')(value, 0) %>%"
          }
          var ctx = document.getElementById(id).getContext('2d')
          new Chart(ctx).Pie(data, options)
        })
      })
      configure_overlays_visibility()
    })

  function configure_overlays_visibility () {
    var visible = map.getZoom() < 12
    overlays.forEach((overlay) => {
      visible ? overlay.show() : overlay.hide()
    })
  }

  $rootScope.$on('map_zoom_changed', configure_overlays_visibility)

  $rootScope.$on('map_layer_loaded_data', (e, layer) => {
    if (layer === locationsLayer) {
      $scope.heatmapVisible = layer.heatmapIsVisible()
    }
  })

  $scope.toggleHeatmap = () => {
    $scope.heatmapOn = !$scope.heatmapOn
    if (!$scope.heatmapOn) {
      locationsLayer.setThreshold(0)
    } else {
      locationsLayer.setThreshold(15)
    }
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
