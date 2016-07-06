/* global app map config $ user_id google _ swal location noUiSlider */
// Navigation Menu Controller
app.controller('navigation_menu_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'tracker', '$location', 'state', ($scope, $rootScope, $http, map_tools, tracker, $location, state) => {
  // Controller instance variables
  $scope.new_plan_name = 'Untitled Plan'
  $scope.new_plan_area_name = ''
  $scope.plan_area_label = 'Choose a ' + config.ui.labels.wirecenter
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

  var ids = 0
  var search = $('#new-plan .select2, #plan-combo .select2')
  search.select2({
    placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
    ajax: {
      url: '/search/addresses',
      dataType: 'json',
      delay: 250,
      data: (term) => ({ text: term }),
      results: (data, params) => {
        var items = data.map((location) => {
          return {
            id: 'id-' + (++ids),
            text: location.name,
            bounds: location.bounds,
            centroid: location.centroid
          }
        })
        $scope.search_results = items
        return {
          results: items,
          pagination: {
            more: false
          }
        }
      },
      cache: true
    }
  }).on('change', (e) => {
    var selected = e.added
    if (selected) {
      $scope.new_plan_area_name = selected.text
      $scope.new_plan_area_bounds = selected.bounds
      $scope.new_plan_area_centroid = selected.centroid
    }
  })

  $scope.shared_plan

  $scope.plan = null
  $scope.plans = []

  $scope.user_id = user_id

  $scope.show_market_profile = config.ui.top_bar_tools.indexOf('market_profile') >= 0
  $scope.show_customer_profile = config.ui.top_bar_tools.indexOf('customer_profile') >= 0
  $scope.show_financial_profile = config.ui.top_bar_tools.indexOf('financial_profile') >= 0

  var newPlanMap

  function initMap () {
    if (newPlanMap) return

    var styles = [{
      featureType: 'poi',
      elementType: 'labels',
      stylers: [ { visibility: 'off' } ]
    }]

    newPlanMap = new google.maps.Map(document.getElementById('newPlanMap_canvas'), {
      zoom: 12,
      center: {lat: -34.397, lng: 150.644},
      styles: styles,
      disableDefaultUI: true,
      draggable: false
    })
  }

  $scope.selectPlan = function (plan) {
    $scope.plan = plan
    state.loadPlan(plan)
    $rootScope.$broadcast('plan_selected', plan)
    $('#select-plan').modal('hide')
    $('#plan-combo').modal('hide')
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
    recalculateMarketProfile()
  })

  ;['dragend', 'zoom_changed'].forEach((event_name) => {
    $rootScope.$on('map_' + event_name, () => {
      recalculateMarketProfile()
    })
  })

  // --
  function recalculateMarketProfile () {
    $scope.market_profile_calculating = true
    map.ready(() => {
      var bounds = map.getBounds()
      var args = {
        params: {
          type: 'route',
          nelat: bounds.getNorthEast().lat(),
          nelon: bounds.getNorthEast().lng(),
          swlat: bounds.getSouthWest().lat(),
          swlon: bounds.getSouthWest().lng(),
          zoom: map.getZoom(),
          threshold: 0
        }
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
    })
  }

  $scope.openMarketProfile = () => {
    $rootScope.$broadcast('market_profile_selected', $scope.market_profile)
    tracker.track('Global market profile')
  }

  $scope.openCustomerProfile = () => {
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
        $scope.loadPlans()
      })
    })
  }

  $scope.loadPlans = (callback) => {
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
    $http.get('/network_plan/' + plan_id).success((response) => {
      $scope.selectPlan(response)
    })
  }

  $scope.showPlans = () => {
    $scope.loadPlans(() => {
      $('#select-plan').modal('show')
      tracker.track('Open Analysis')
    })
  }

  $scope.showCombo = () => {
    $scope.loadPlans(() => {
      $('#plan-combo').modal('show')
      tracker.track('Open Analysis')
    })
  }

  $scope.manageNetworkPlans = () => {
    $scope.loadPlans(() => {
      $('#manage-network-plans').modal('show')
      tracker.track('Manage Analyses')
    })
  }

  $scope.sortBy = (key, descending) => {
    $scope.plans = _.sortBy($scope.plans, (plan) => plan[key])
    if (descending) {
      $scope.plans = $scope.plans.reverse()
    }
  }

  $scope.new_plan = () => {
    $('#new-plan').modal('show')
    // initMap()
    tracker.track('Create New Analysis')
  }

  $scope.openFinancialProfile = () => {
    map_tools.show('financial_profile')
  }

  // If we use this more than once it should be more generalized...
  $scope.clear_default_text = () => {
    $scope.new_plan_name = ''
  }

  $scope.saveNewPlan = () => {
    var params = {
      name: $scope.new_plan_name,
      area: {
        name: $scope.new_plan_area_name,
        centroid: $scope.new_plan_area_centroid,
        bounds: $scope.new_plan_area_bounds
      }
    }
    $http.post('/network_plan/create', params).success((response) => {
      state.clearPlan(response)
      $scope.selectPlan(response)
      $('#new-plan').modal('hide')
      $('#plan-combo').modal('hide')
      $scope.loadPlans()
    })
  }

  $('#new-plan').on('hidden.bs.modal', () => {
    $scope.new_plan_name = 'Untitled Analysis'
    $scope.new_plan_area_name = ''
    $('#new-plan select').select2('val', '')
    newPlanMap && newPlanMap.setCenter({lat: -34.397, lng: 150.644})
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

  $scope.clearPlan = () => {
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

  $scope.exportKmlName = () => {
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

  // var nonLinearSlider = document.getElementById('year-slider')
  // noUiSlider.create(nonLinearSlider, {
  //   behaviour: 'tap',
  //   connect: true,
  //   start: [ 2016, 2019 ],
  //   range: {
  //     min: 2016,
  //     max: 2019,
  //     '0%': [ 2016, 1 ],
  //     '100%': [ 2019, 1 ]
  //   },
  //   pips: {
  //     mode: 'values',
  //     values: [2016, 2017, 2018, 2019],
  //     density: 0
  //   }
  // })

  google.charts.load('current', {'packages': ['gantt']})

  function daysToMilliseconds (days) {
    return days * 24 * 60 * 60 * 1000
  }

  function drawChart () {
    var data = new google.visualization.DataTable()
    data.addColumn('string', 'Task ID')
    data.addColumn('string', 'Task Name')
    data.addColumn('date', 'Start Date')
    data.addColumn('date', 'End Date')
    data.addColumn('number', 'Duration')
    data.addColumn('number', 'Percent Complete')
    data.addColumn('string', 'Dependencies')

    data.addRows([
      ['ABC123', 'ABC123', new Date(2016, 0, 1), new Date(2017, 0, 5), null, 100, null],
      ['ABC124', 'ABC124', new Date(2016, 0, 2), new Date(2017, 0, 9), daysToMilliseconds(3), 25, null],
      ['ABC125', 'ABC125', new Date(2017, 0, 3), new Date(2018, 0, 7), daysToMilliseconds(1), 20, null],
      ['ABC126', 'ABC126', new Date(2017, 0, 4), new Date(2018, 0, 10), daysToMilliseconds(1), 0, null],
      ['ABC127', 'ABC127', new Date(2018, 0, 5), new Date(2019, 0, 6), daysToMilliseconds(1), 100, null]
    ])

    var options = {
      height: 275
    }
    var chart = new google.visualization.Gantt(document.getElementById('build-sequence-chart'))
    chart.draw(data, options)
  }

  $('#build-sequence').on('shown.bs.modal', drawChart)
}])
