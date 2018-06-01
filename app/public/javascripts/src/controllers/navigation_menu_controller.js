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
  $scope.projectId = state.loggedInUser.projectId

  $scope.show_market_profile = config.ui.top_bar_tools.indexOf('market_profile') >= 0
  $scope.show_customer_profile = config.ui.top_bar_tools.indexOf('customer_profile') >= 0
  $scope.show_financial_profile = config.ui.top_bar_tools.indexOf('financial_profile') >= 0

  var newPlanMap

  $rootScope.$on('go-home', () => {
    $scope.selectPlan(null)
  })

  $rootScope.$on('plan_selected', (e, plan) => {

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

  // load plan depending on the URL
  var path = $location.path()
  if (path.indexOf('/plan/') === 0) {
    var plan_id = path.substring('/plan/'.length)
    $http.get(`/service/v1/plan/${plan_id}?user_id=${$scope.user_id}`)
      .then((response) => {
        $scope.selectPlan(response.data)
      })
  }

  $scope.openFinancialProfile = () => {
    map_tools.show('financial_profile')
  }

  // If we use this more than once it should be more generalized...
  $scope.clear_default_text = () => {
    $scope.new_plan_name = ''
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

  $rootScope.$on('show_create_plan_dialog', function (events) {
    $scope.showCombo();
    $("#plan-combo").find("a[href='#plan-combo-create']").trigger('click')
    $scope.paneClicked('add');
  })

}])
