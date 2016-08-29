/* global app _ config user_id $ map google randomColor tinycolor Chart */
// Locations Controller
app.controller('locations_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'map_layers', 'MapLayer', 'CustomOverlay', 'tracker', ($scope, $rootScope, $http, map_tools, map_layers, MapLayer, CustomOverlay, tracker) => {
  $scope.ARO_CLIENT = config.ARO_CLIENT
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

  $scope.available_tools = _.reject($scope.available_tools, (tool) => {
    return config.ui.map_tools.locations.build.indexOf(tool.key) === -1
  })

  $scope.user_id = user_id

  $scope.show_commercial = config.ui.map_tools.locations.view.indexOf('commercial') >= 0
  $scope.show_residential = config.ui.map_tools.locations.view.indexOf('residential') >= 0

  $scope.show_businesses = $scope.show_commercial
  $scope.show_households = $scope.show_residential
  $scope.show_towers = false
  $scope.new_location_data = null
  $scope.industries = []
  $scope.business_categories_selected = []
  $scope.household_categories_selected = []

  var locationStyles = {
    normal: {
      visible: true,
      fillColor: 'blue',
      strokeColor: 'blue',
      strokeWeight: 1
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
    if (styles.icon) return
    var totalBusinesses = feature.getProperty('total_businesses') || 0
    var totalHouseholds = feature.getProperty('total_households') || 0
    var selected = feature.getProperty('selected') ? 'selected' : 'default'
    var largestType = feature.getProperty('largest_type')
    var type = (totalBusinesses && totalHouseholds)
      ? 'composite_location'
      : totalBusinesses ? 'businesses' : 'households'
    styles.icon = `/images/map_icons/${config.ARO_CLIENT}/${type}_${largestType}_${selected}.png`
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
    threshold: 15,
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

  var towersLayer = new MapLayer({
    name: 'Towers',
    type: 'towers',
    changes: 'locations',
    short_name: 'T',
    api_endpoint: '/towers/:plan_id',
    style_options: {
      normal: {
        icon: `/images/map_icons/${config.ARO_CLIENT}/tower.png`,
        visible: true
      }
    },
    threshold: 8,
    reload: 'always'
  })

  map_layers.addFeatureLayer(locationsLayer)
  map_layers.addFeatureLayer(selectedLocationsLayer)
  map_layers.addFeatureLayer(customerProfileLayer)
  map_layers.addFeatureLayer(towersLayer)

  function whatLocationsAreShowing () {
    if (!$scope.show_businesses && !$scope.show_households) {
      locationsLayer.shows = []
    } else if ($scope.show_businesses && $scope.show_households) {
      locationsLayer.shows = ['businesses', 'households']
    } else if ($scope.show_businesses) {
      locationsLayer.shows = ['businesses']
    } else if ($scope.show_households) {
      locationsLayer.shows = ['households']
    }
  }
  whatLocationsAreShowing()

  $http.get('/locations_filters').success((response) => {
    $scope.industries = response.industries
    $scope.customer_types = response.customer_types
    $scope.employees_by_location = response.employees_by_location
    $scope.business_categories = response.business_categories
    $scope.household_categories = response.household_categories

    $scope.business_categories_selected = []
    $scope.business_categories.forEach((category) => {
      $scope.business_categories_selected[category.name] = true
    })
    $scope.business_categories_selected['2kplus'] = true

    $scope.household_categories_selected = []
    $scope.household_categories.forEach((category) => {
      $scope.household_categories_selected[category.name] = true
    })

    // industries
    $('#create-location select.industries').select2({ placeholder: 'Select an industry' })

    // customer_types
    $('#create-location select.households_customer_types').select2({ placeholder: 'Select a customer type' })
    $('#create-location select.businesses_customer_types').select2({ placeholder: 'Select a customer type' })

    // filters
    $scope.industries.forEach((industry) => {
      industry.text = industry.industry_name
    })
    $scope.customer_types.forEach((customer_type) => {
      customer_type.text = customer_type.name
    })
    $scope.employees_by_location.forEach((employee_by_location) => {
      employee_by_location.text = employee_by_location.value_range
    })

    $('#locations_controller .select2-industries').select2({
      placeholder: 'Any industry',
      multiple: true,
      data: $scope.industries
    })

    $('#locations_controller .select2-customer-types').select2({
      placeholder: 'Any customer type',
      multiple: true,
      data: $scope.customer_types
    })

    $('#locations_controller .select2-number-of-employees').select2({
      placeholder: 'Any number of employees',
      multiple: true,
      data: $scope.employees_by_location
    })
  })

  $scope.change_towers_layer = () => {
    towersLayer.toggleVisibility()
    $rootScope.$broadcast('towers_layer_changed')
  }

  $scope.changeLocationsLayer = () => {
    tracker.track('Locations / ' + $scope.overlay)

    customerProfileLayer.setVisible($scope.overlay === 'customer_profile')

    const subcategories = (key) => {
      var obj = $scope[`${key}_categories_selected`]
      var categories = Object.keys(obj).filter((key) => obj[key])
      return categories
    }

    if ($scope.overlay === 'none') {
      var businessCategories = subcategories('business')
      var householdCategories = subcategories('household')
      if (!$scope.show_businesses) {
        businessCategories = _.difference(businessCategories, ['medium', 'large'])
      }
      if (!$scope.show_households) {
        householdCategories = []
      }

      if (businessCategories.length === 0 && householdCategories.length === 0) {
        locationsLayer.hide()
      } else {
        var options = {
          business_categories: businessCategories,
          household_categories: householdCategories
        }
        locationsLayer.setApiEndpoint('/locations/:plan_id', options)
        locationsLayer.show()
      }
    } else {
      locationsLayer.hide()
    }
    whatLocationsAreShowing()
    $rootScope.$broadcast('locations_layer_changed')

    if ($scope.show_businesses && $scope.overlay === 'none') {
      $('#locations_controller .business-filter').prop('disabled', false)
    } else {
      $('#locations_controller .business-filter').select2('val', [], true)
      $('#locations_controller .business-filter').prop('disabled', true)
    }

    changeOptimization()
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

  $rootScope.$on('route_planning_changed', () => {
    // locationsLayer.reloadData(true)
    // selectedLocationsLayer.reloadData(true)
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

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan

    if (plan) {
      map.ready(() => {
        // map_layers.getEquipmentLayer('network_nodes').set_always_show_selected($scope.always_shows_sources)
        // locationsLayer.set_always_show_selected($scope.always_shows_targets)
        selectedLocationsLayer.show()
      })
    }
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

  function changeOptimization () {
    $rootScope.optimizeBusinesses = $scope.show_businesses
    $rootScope.optimizeSMB = $scope.business_categories_selected['small']
    $rootScope.optimizeHouseholds = $scope.show_households
    $rootScope.optimizeTowers = $scope.show_towers
    $rootScope.optimize2kplus = $scope.business_categories_selected['2kplus']
  }
  changeOptimization()
}])
