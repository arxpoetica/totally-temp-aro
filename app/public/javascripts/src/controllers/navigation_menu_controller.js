/* global app map config $ user_id google _ swal location noUiSlider */
// Navigation Menu Controller
app.controller('navigation_menu_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'tracker', '$location', 'state', ($scope, $rootScope, $http, map_tools, tracker, $location, state) => {
  // Controller instance variables
  $scope.new_plan_name = 'Untitled Plan'
  $scope.new_plan_area_name = ''
  $scope.new_plan_area_centroid
  $scope.new_plan_area_bounds
  $scope.edit_plan_name

  if (config.route_planning.length > 0) {
    $scope.market_size_scale_n = 1000000
    $scope.market_size_scale_s = 'M'
  } else {
    $scope.market_size_scale_n = 1000000000
    $scope.market_size_scale_s = 'B'
  }

  $('#new-plan select').select2({
    placeholder: 'Enter a CLLI Code'
  }).on('change', () => {
    $scope.look_up_area()
  })

  $scope.shared_plan

  $scope.plan = null
  $scope.plans = []

  $scope.user_id = user_id

  $scope.show_market_profile = config.ui.top_bar_tools.indexOf('market_profile') >= 0
  $scope.show_customer_profile = config.ui.top_bar_tools.indexOf('customer_profile') >= 0
  $scope.show_financial_profile = config.ui.top_bar_tools.indexOf('financial_profile') >= 0

  var new_plan_map

  function initMap () {
    if (new_plan_map) return

    var styles = [{
      featureType: 'poi',
      elementType: 'labels',
      stylers: [ { visibility: 'off' } ]
    }]

    new_plan_map = new google.maps.Map(document.getElementById('new_plan_map_canvas'), {
      zoom: 12,
      center: {lat: -34.397, lng: 150.644},
      styles: styles,
      disableDefaultUI: true,
      draggable: false
    })
  }

  $scope.look_up_area = function () {
    $scope.new_plan_area_name = $('#new-plan select').select2('val')
    var address = encodeURIComponent($scope.new_plan_area_name)
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address)
      .success((response) => {
        var results = response.results
        var result = results[0]
        if (!result) return
        $scope.new_plan_area_name = result.formatted_address
        // use centroid...
        new_plan_map.setCenter(result.geometry.location)
        // ...or use bounds
        // var bounds = new google.maps.LatLngBounds();
        // bounds.extend(new google.maps.LatLng(result.geometry.bounds.northeast.lat, result.geometry.bounds.northeast.lng));
        // bounds.extend(new google.maps.LatLng(result.geometry.bounds.southwest.lat, result.geometry.bounds.southwest.lng));
        // new_plan_map.fitBounds(bounds);
        $scope.new_plan_area_centroid = result.geometry.location
        $scope.new_plan_area_bounds = result.geometry.viewport
      })
  }

  $scope.select_plan = function (plan) {
    $scope.plan = plan
    state.loadPlan(plan)
    $rootScope.$broadcast('plan_selected', plan)
    $('#select-plan').modal('hide')
    var centroid = plan && plan.area_centroid
    if (centroid) {
      try {
        map.setCenter(JSON.parse(state.get('mapCenter')))
        map.setZoom(+state.get('mapZoom') || 14)
      } catch (err) {
        map.setCenter({ lat: centroid.coordinates[1], lng: centroid.coordinates[0] })
        map.setZoom(14)
      }
    }
    $location.path(plan ? '/plan/' + plan.id : '/')

    $scope.market_profile = {}
    $scope.market_profile_current_year = {}
  }

  $rootScope.$on('route_changed', (e) => {
    if (!$scope.plan) return
    recalculate_market_profile()
  })

  function recalculate_market_profile () {
    $scope.market_profile_calculating = true
    var args = {
      params: { type: 'route' }
    }
    $http.get('/market_size/plan/' + $scope.plan.id + '/calculate', args)
      .success((response) => {
        $scope.market_profile = response
        $scope.market_profile_current_year = _.findWhere($scope.market_profile.market_size, { year: new Date().getFullYear() })
        if ($scope.market_profile_current_year) {
          $scope.market_profile_fair_share_current_year_total = $scope.market_profile_current_year.total * response.share
        }
        $scope.market_profile_calculating = false
        $scope.market_profile_share = response.share
      })
      .error(() => {
        $scope.market_profile_calculating = false
      })
  }

  $scope.open_market_profile = () => {
    $rootScope.$broadcast('market_profile_selected', $scope.market_profile)
    tracker.track('Global market profile')
  }

  $scope.open_customer_profile = () => {
    $rootScope.$broadcast('customer_profile_selected', $scope.market_profile)
    tracker.track('Global customer profile')
  }

  $scope.deletePlan = (plan) => {
    if (!plan) return
    tracker.track('Manage Analyses / Delete Analysis')

    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted plan!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      if ($scope.plan && plan.id === $scope.plan.id) {
        $scope.plan = null
        state.loadPlan(null)
        $rootScope.$broadcast('plan_selected', null)
      }
      $http.post('/network_plan/' + plan.id + '/delete').success((response) => {
        $scope.load_plans()
      })
    })
  }

  $scope.load_plans = (callback) => {
    var options = {
      url: '/network_plan/find_all',
      method: 'GET',
      params: {
        text: $scope.search_text
      }
    }
    $http(options).success((response) => {
      $scope.plans = response
      callback && callback()
    })
  }

  // load plan depending on the URL
  var path = $location.path()
  if (path.indexOf('/plan/') === 0) {
    var plan_id = path.substring('/plan/'.length)
    $scope.load_plans(() => {
      var plan = _.findWhere($scope.plans, { id: plan_id })
      if (plan) {
        $scope.select_plan(plan)
      }
    })
  }

  $scope.show_plans = () => {
    $scope.load_plans(() => {
      $('#select-plan').modal('show')
      tracker.track('Open Analysis')
    })
  }

  $scope.manage_network_plans = () => {
    $scope.load_plans(() => {
      $('#manage-network-plans').modal('show')
      tracker.track('Manage Analyses')
    })
  }

  $scope.sort_by = (key, descending) => {
    $scope.plans = _.sortBy($scope.plans, (plan) => plan[key])
    if (descending) {
      $scope.plans = $scope.plans.reverse()
    }
  }

  $scope.new_plan = () => {
    $('#new-plan').modal('show')
    initMap()
    tracker.track('Create New Analysis')
  }

  // If we use this more than once it should be more generalized...
  $scope.clear_default_text = () => {
    $scope.new_plan_name = ''
  }

  $scope.save_new_plan = () => {
    var params = {
      name: $scope.new_plan_name,
      area: {
        name: $scope.new_plan_area_name,
        centroid: $scope.new_plan_area_centroid,
        bounds: $scope.new_plan_area_bounds
      }
    }
    $http.post('/network_plan/create', params).success((response) => {
      $scope.select_plan(response)
      $('#new-plan').modal('hide')
      $scope.load_plans()
    })
  }

  $('#new-plan').on('hidden.bs.modal', () => {
    $scope.new_plan_name = 'Untitled Analysis'
    $scope.new_plan_area_name = ''
    $('#new-plan select').select2('val', '')
    new_plan_map.setCenter({lat: -34.397, lng: 150.644})
  })

  $scope.save_as = () => {
    $scope.edit_plan_name = $scope.plan.name
    $('#edit-plan').modal('show')
  }

  $scope.save_changes = () => {
    $scope.plan.name = $scope.edit_plan_name
    $http.post('/network_plan/' + $scope.plan.id + '/save', $scope.plan).success((response) => {
      $('#edit-plan').modal('hide')
    })
  }

  $scope.clear_plan = () => {
    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted data!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, clear it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/network_plan/' + $scope.plan.id + '/clear').success((response) => {
        $rootScope.$broadcast('plan_cleared', $scope.plan)
      })
    })
  }

  $scope.export_kml_name = () => {
    $('#export-plan').modal('show')
  }

  $scope.export_kml = () => {
    var params = { name: $scope.kml_file_name }
    if (!params.name.match(/^[a-zA-Z0-9-_]+$/)) {
      $('#export-error').show()
    } else {
      $('#export-error').hide()
      $('#export-plan').modal('hide')

      location.href = '/network_plan/' + $scope.plan.id + '/' + params.name + '/export'
    }
  }

  $scope.showSharePlan = (plan) => {
    $scope.shared_plan = plan
    $('#share-plan').modal('show')
    $('#share-plan .modal-title').text(`Share "${plan.name}"`)
    tracker.track('Manage Analyses / Share Analysis')
  }

  $scope.sharePlan = () => {
    $('#share-plan').modal('hide')
    var params = {
      user_id: +$('#share-plan-search').select2('val'), // will be removed in select2 4.1
      message: $('#share-plan textarea').val()
    }
    $http.post('/permissions/' + $scope.shared_route.id + '/grant', params).success((response) => {
      swal({
        title: 'Network plan shared successfully',
        type: 'success'
      })
    })
  }

  var nonLinearSlider = document.getElementById('year-slider')
  noUiSlider.create(nonLinearSlider, {
    behaviour: 'tap',
    connect: true,
    start: [ 2016, 2019 ],
    range: {
      min: 2016,
      max: 2019,
      '0%': [ 2016, 1 ],
      '100%': [ 2019, 1 ]
    },
    pips: {
      mode: 'values',
      values: [2016, 2017, 2018, 2019],
      density: 0
    }
  })
}])
