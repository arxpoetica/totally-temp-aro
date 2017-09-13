/* global app map config $ user_id google _ swal location */
// Navigation Menu Controller
app.controller('navigation_menu_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'tracker', 'tileDataService', '$location', 'state','$q', ($scope, $rootScope, $http, map_tools, tracker, tileDataService, $location, state , $q) => {
  // Controller instance variables
  $scope.new_plan_name = 'Untitled Plan'
  $scope.new_plan_area_name = ''
  $scope.plan_area_label = 'Choose a ' + config.ui.labels.wirecenter
  $scope.new_plan_area_centroid
  $scope.new_plan_area_bounds
  $scope.edit_plan_name
  $scope.allPlans = false

  $scope.currentPage = 1
  $scope.pages = [1]
  $scope.planView ='add';
  if (config.route_planning.length > 0) {
    $scope.market_size_scale_n = 1000000
    $scope.market_size_scale_s = 'M'
  } else {
    $scope.market_size_scale_n = 1000000000
    $scope.market_size_scale_s = 'B'
  }

  var ids = 0
  var customLoc = {};
  var search = $('#plan-combo .select2')
  search.select2({
    placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
    ajax: {
      url: '/search/addresses',
      dataType: 'json',
      delay: 250,
      data: (term) => ({ text: term }),
      results: (data, params) => {
        var items = [];
        data.forEach((location) => {
          items.push(
              {
                id: 'id-' + (++ids),
                text: location.name,
                bounds: location.bounds,
                centroid: location.centroid
              }
          );
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
    },
    initSelection : function (select, callback) {
      callback(customLoc)
    },
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
  $scope.projectId = globalUser.projectId

  $scope.show_market_profile = config.ui.top_bar_tools.indexOf('market_profile') >= 0
  $scope.show_customer_profile = config.ui.top_bar_tools.indexOf('customer_profile') >= 0
  $scope.show_financial_profile = config.ui.top_bar_tools.indexOf('financial_profile') >= 0

  var newPlanMap

  $rootScope.$on('go-home', () => {
    $scope.selectPlan(null)
  })

  $scope.selectPlan = function (plan) {
    $scope.plan = plan
    $('#plan-saving').stop().hide()
    $('#plan-saved').stop().hide()
    $('#plan-saving-progress').hide()
    state.loadPlan(plan.id)
    $rootScope.$broadcast('plan_selected', plan)
    $('#select-plan').modal('hide')
    $('#plan-combo').modal('hide')
  }

  $rootScope.$on('plan_selected', (e, plan) => {

    // Clear the client side tile cache
    tileDataService.clearDataCache()
    tileDataService.markHtmlCacheDirty()
    state.requestMapLayerRefresh.next({})

    $scope.plan = plan
    state.loadPlan(plan.id)
    $location.path(plan ? '/plan/' + plan.id : '/')

    $scope.market_profile = {}
    $scope.market_profile_current_year = {}
    $rootScope.currentPlan = plan;

    if(!plan){
        //collapse optimized equipments with no plan
      $('#serviceLayersAccordion').find('#serviceLayerall').removeClass('in');
    }
  })
  
  $rootScope.$on('route_planning_changed', (e, plan) => {
    $scope.plan = plan
  })

  $rootScope.$on('plan_cleared', (e, plan) => {
    // Clear the client side tile cache
    tileDataService.clearDataCache()
    tileDataService.markHtmlCacheDirty()
    state.requestMapLayerRefresh.next({})
  })

  // When a plan is done, clear the tile cache
  $rootScope.$on('optimization_stopped_polling', () => {
    tileDataService.clearDataCache()
    tileDataService.markHtmlCacheDirty()
    state.requestMapLayerRefresh.next({})
  })

  $rootScope.$on('route_changed', (e) => {
    // This method is called before (and after) optimization is done. If you clear the tile cache here, then
    // aro-service will save the cache in memory before optimization is done, and we won't get planned data
    // after the optimization is done.
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
    if (!$scope.plan || config.ARO_CLIENT === 'verizon') return
    $scope.market_profile_calculating = true
    map.ready(() => {
      var bounds = map.getBounds()
      var args = {
        params: {
          type: 'all',
          nelat: bounds.getNorthEast().lat(),
          nelon: bounds.getNorthEast().lng(),
          swlat: bounds.getSouthWest().lat(),
          swlon: bounds.getSouthWest().lng(),
          zoom: map.getZoom(),
          threshold: 0
        }
      }
      $http.get('/market_size/plan/' + $scope.plan.id + '/calculate', args)
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            $scope.market_profile = response.data
            $scope.market_profile_current_year = _.findWhere($scope.market_profile.market_size, { year: new Date().getFullYear() })
            if ($scope.market_profile_current_year) {
              $scope.market_profile_fair_share_current_year_total = $scope.market_profile_current_year.total * response.data.share
            }
            $scope.market_profile_calculating = false
            $scope.market_profile_share = response.data.share
          } else {
            $scope.market_profile_calculating = false
          }
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
        delete $rootScope.currentPlan;
      }
      $http.delete(`/service/v1/plan/${plan.id}?user_id=${$scope.user_id}`).then((response) => {
        $scope.loadPlans()
      })
    })
  }

  var interval = null

  $('#select-plan').on('hidden.bs.modal', () => {
    clearInterval(interval)
  })

  $scope.loadPlans = function (page, callback) {
    clearInterval(interval)
    $scope.currentPage = page || 1
    $scope.maxResults = 10
    if(page > 1) {
      var start = $scope.maxResults * (page - 1);
      var end   = start + $scope.maxResults;
      $scope.plans = $scope.allPlans.slice(start, end);
      return;
    }

    var load = (callback) => {

      var planOptions = {
        url: '/service/v1/plan',
        method: 'GET',
        params: {
          user_id: $scope.user_id,
          search: $scope.search_text,
          project_id: $scope.projectId
        }
      }
      $http(planOptions)
        .then((response) => {
            $http.get('/optimization/processes').then((running) => {
              response.data.forEach((plan) => {
                var info = running.data.find((status) => status.plan.id === +plan.id)
                if (info) {
                  var diff = (Date.now() - new Date(info.startDate).getTime()) / 1000
                  var min = Math.floor(diff / 60)
                  var sec = Math.ceil(diff % 60)
                  plan.progressString = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`
                  plan.progress = info.progress
                  plan.startDate = info.startDate
                  plan.optimizationState = info.optimizationState
                }
              })
              $scope.allPlans = response.data
              $scope.plans = response.data.slice(0, $scope.maxResults);
              // $scope.pages = response.data.pages
              $scope.pages = [];
              var pageSize = Math.floor(response.data.length / $scope.maxResults) + (response.data.length % $scope.maxResults > 0 ? 1 : 0);
              for (var i = 1; i <= pageSize; i++) {
                $scope.pages.push(i);
              }

              callback && callback()
            })
        })
    }
    load(callback)
    interval = setInterval(load, 100000)
  }

  // load plan depending on the URL
  var path = $location.path()
  if (path.indexOf('/plan/') === 0) {
    var plan_id = path.substring('/plan/'.length)
    $http.get(`/service/v1/plan/${plan_id}?user_id=${$scope.user_id}`)
      .then((response) => {
        $scope.selectPlan(response.data)
      })
  }

  $scope.showPlans = () => {
    $scope.loadPlans(1, () => {
      $('#select-plan').modal('show')
      tracker.track('Open Analysis')


    })
  }

  $scope.showCombo = () => {
    $scope.loadPlans(1, () => {
      $('#plan-combo').modal('show')
      tracker.track('Open Analysis')

      reloadCurrentLocation();
    })
  }

  $scope.showReports = () => {
    $('#reports').modal('show')
  }

  $scope.manageNetworkPlans = () => {
    $scope.loadPlans(1, () => {
      $('#manage-network-plans').modal('show')
      tracker.track('Manage Analyses')
    })
  }

  $scope.sortBy = (key, descending) => {
    $scope.sortField = key
    $scope.sortOrder = descending ? 'DESC' : 'ASC'

    $scope.loadPlans()
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
      areaName: $scope.new_plan_area_name,
      latitude: $scope.new_plan_area_centroid.coordinates[1],
      longitude: $scope.new_plan_area_centroid.coordinates[0],
      projectId: $scope.projectId
    }

    $http.post('/service/v1/plan?user_id=' + $scope.user_id, params).then((response) => {
      $scope.selectPlan(response.data)
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
    $http.post('/network_plan/' + $scope.plan.id + '/save', { name: $scope.plan.name }).then((response) => {
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
      $http.post('/network_plan/' + $scope.plan.id + '/clear', { userId: $scope.user_id }).then((response) => {
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

  $scope.stopOptimization = (plan) => {
    $http.post(`/optimization/stop/${plan.id}`)
      .then((response) => {
        $scope.loadPlans($scope.currentPage)
      })
  }

  $scope.sharePlan = () => {
    $('#share-plan').modal('hide')
    var params = {
      user_id: +$('#share-plan-search').select2('val'), // will be removed in select2 4.1
      message: $('#share-plan textarea').val()
    }
    $http.post('/permissions/' + $scope.shared_plan.id + '/grant', params).then((response) => {
      swal({
        title: 'Network plan shared successfully',
        type: 'success'
      })
    })
  }

  $scope.openReport = (plan) => {
    var modal = null
    ;['#select-plan', '#plan-combo'].forEach((id) => {
      if (($(id).data('bs.modal') || {}).isShown) {
        modal = id
        $(id).modal('hide')
      }
    })
    $rootScope.$broadcast('open-report', plan, modal)
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

  $scope.openReports = () => {
    $rootScope.$broadcast('open-report', $scope.plan)
  }

  $scope.paneClicked = function (view) {
    $scope.planView = view;
  }

  function geoCode(latlng) {
    var promise = $q.defer()

    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === 'OK') {
        if (results[1]) {
          promise.resolve({message : results[0].formatted_address});
        } else {
          promise.reject({error : 'No results found'});
        }
      } else {
        promise.reject({error : 'Geocoder failed due to: ' + status})
      }
    });

    return promise.promise;
  }

  function fetchLocation(location) {
    return $http.get("/search/addresses" , {params : {text : location.message}}).then(function (results) {

      var location = results.data[0];
      var loc = {
        id: 'id-' + (++ids),
        text: location.name,
        bounds: location.bounds,
        centroid: location.centroid,
        geocoded : true
      };

      return loc;

    });
  }


  function reloadCurrentLocation() {
    var center = map.getCenter();
    geoCode(center).then(function (address) {
      fetchLocation(address).then(function (location) {
        customLoc = location
        $(search[0]).select2('val' , location ,true);
      })
    })
  }


    $rootScope.$on('show_create_plan_dialog' , function (events) {
        $scope.showCombo();
        $("#plan-combo").find("a[href='#plan-combo-create']").trigger('click')
        $scope.paneClicked('add');
    })

}])
