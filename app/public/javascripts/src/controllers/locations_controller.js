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

    // Select the business, household, celltower categories to show
    var business_categories = []
    var household_categories = []
    var towers = []
    var dataSources = new Set()
    $scope.planState.locationTypes.forEach((locationType) => {
      if ((locationType.type === 'business') && locationType.checked) {
        business_categories.push(locationType.key)
      } else if ((locationType.type === 'household') && locationType.checked) {
        household_categories.push('small')
        household_categories.push('medium')
      } else if ((locationType.type === 'celltower') && locationType.checked) {
        towers.push('towers')
        dataSources.add(1)  // Pushing towers only works if we also have the global data source id in there
      }
    })

    // Select the datasources to show
    if ($scope.planState.locationDataSources.useGlobalBusiness) {
      dataSources.add(1)
    }
    if ($scope.planState.locationDataSources.useGlobalHousehold) {
      dataSources.add(1)
    }
    if ($scope.planState.locationDataSources.useGlobalCellTower) {
      dataSources.add(1)
    }

    // Set the selected options in the API endpoint that will show locations in the layer
    var options = {
      business_categories: business_categories,
      household_categories: household_categories,
      towers: towers,
      dataSources: Array.from(dataSources)
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

    if (plan) {
      plan.location_types = plan.location_types || []
      map.ready(() => {
        selectedLocationsLayer.show()
        selectedLocationsLayer.reloadData()
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
