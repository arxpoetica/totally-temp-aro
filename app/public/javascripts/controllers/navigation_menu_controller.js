// Navigation Menu Controller
app.controller('navigation_menu_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'selection', 'tracker', '$location', function($scope, $rootScope, $http, map_tools, selection, tracker, $location) {
  // Controller instance variables
  $scope.selection = selection;
  $scope.new_route_name = 'Untitled Analysis';
  $scope.new_route_area_name = '';
  $scope.new_route_area_centroid;
  $scope.new_route_area_bounds;
  $scope.edit_route_name;

  $('#new-route select').select2({
    placeholder: 'Choose a city',
  }).on('change', function() {
    $scope.look_up_area();
  });

  $scope.shared_route;

  $scope.route = null;
  $scope.routes = [];

  $scope.user_id = user_id;

  $scope.show_market_profile = config.ui.top_bar_tools.indexOf('market_profile') >= 0;
  $scope.show_customer_profile = config.ui.top_bar_tools.indexOf('customer_profile') >= 0;
  $scope.show_financial_profile = config.ui.top_bar_tools.indexOf('financial_profile') >= 0;

  /************
  * FUNCTIONS *
  *************/

  var new_route_map;

  function init_map() {
    if (new_route_map) return;

    var styles = [{
      featureType: 'poi',
      elementType: 'labels',
      stylers: [ { visibility: 'off' } ],
    }];

    new_route_map = new google.maps.Map(document.getElementById('new_route_map_canvas'), {
      zoom: 12,
      center: {lat: -34.397, lng: 150.644},
      styles: styles,
      disableDefaultUI: true,
      draggable: false,
    });
  }

  $scope.look_up_area = function() {
    $scope.new_route_area_name = $('#new-route select').select2('val');
    var address = encodeURIComponent($scope.new_route_area_name);
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?address='+address)
      .success(function(response) {
        var results = response.results;
        var result = results[0];
        if (!result) return;
        $scope.new_route_area_name = result.formatted_address;
        // use centroid...
        new_route_map.setCenter(result.geometry.location);
        // ...or use bounds
        // var bounds = new google.maps.LatLngBounds();
        // bounds.extend(new google.maps.LatLng(result.geometry.bounds.northeast.lat, result.geometry.bounds.northeast.lng));
        // bounds.extend(new google.maps.LatLng(result.geometry.bounds.southwest.lat, result.geometry.bounds.southwest.lng));
        // new_route_map.fitBounds(bounds);
        $scope.new_route_area_centroid = result.geometry.location;
        $scope.new_route_area_bounds = result.geometry.bounds;
      });
  };

  $scope.select_route = function(route) {
    $scope.route = route;
    $rootScope.$broadcast('route_selected', route);
    $('#select-route').modal('hide');
    var centroid = route && route.area_centroid;
    if (centroid) {
      map.setCenter({ lat: centroid.coordinates[1], lng: centroid.coordinates[0] });
      map.setZoom(14);
    }
    $location.path(route ? '/plan/'+route.id : '/');

    $scope.market_profile = {};
    $scope.market_profile_current_year = {};
  };

  $rootScope.$on('route_changed', function(e) {
    if (!$scope.route) return;
    recalculate_market_profile();
  });

  function recalculate_market_profile() {
    $scope.market_profile_calculating = true;
    var args = {
      params: { type: 'route' },
    };
    $http.get('/market_size/plan/'+$scope.route.id+'/calculate', args)
      .success(function(response) {
        $scope.market_profile = response;
        $scope.market_profile_current_year = _.findWhere($scope.market_profile.market_size, { year: new Date().getFullYear() });
        if ($scope.market_profile_current_year) {
          $scope.market_profile_fair_share_current_year_total = $scope.market_profile_current_year.total * response.share;
        }
        $scope.market_profile_calculating = false;
        $scope.market_profile_share = response.share;
      })
      .error(function() {
        $scope.market_profile_calculating = false;
      });
  };

  $scope.open_market_profile = function() {
    $rootScope.$broadcast('market_profile_selected', $scope.market_profile);
    tracker.track('Global market profile');
  }

  $scope.open_customer_profile = function() {
    $rootScope.$broadcast('customer_profile_selected', $scope.market_profile);
    tracker.track('Global customer profile');
  }

  $scope.delete_route = function(route) {
    if (!route) return;
    tracker.track('Manage Analyses / Delete Analysis');

    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted route!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      if ($scope.route && route.id === $scope.route.id) {
        $scope.route = null;
        $rootScope.$broadcast('route_selected', null);
      }
      $http.post('/network_plan/'+route.id+'/delete').success(function(response) {
        $scope.load_plans();
      });
    });
  };

  $scope.load_plans = function(callback) {
    var options = {
      url: '/network_plan/find_all',
      method: 'GET',
      params: {
        text: $scope.search_text,
      }
    };
    $http(options).success(function(response) {
      $scope.routes = response;
      callback && callback();
    });
  };

  // load plan depending on the URL
  var path = $location.path();
  if (path.indexOf('/plan/') === 0) {
    var plan_id = +path.substring('/plan/'.length);
    $scope.load_plans(function() {
      var route = _.findWhere($scope.routes, { id: plan_id });
      if (route) {
        $scope.select_route(route);
      }
    });
  }

  $scope.show_routes = function() {
    $scope.load_plans(function() {
      $('#select-route').modal('show');
      tracker.track('Open Analysis');
    });
  };

  $scope.manage_network_plans = function() {
    $scope.load_plans(function() {
      $('#manage-network-plans').modal('show');
      tracker.track('Manage Analyses');
    });
  };

  $scope.sort_by = function(key, descending) {
    $scope.routes = _.sortBy($scope.routes, function(route) {
      return route[key];
    });
    if (descending) {
      $scope.routes = $scope.routes.reverse();
    }
  };

  $scope.new_route = function() {
    $('#new-route').modal('show');
    init_map();
    tracker.track('Create New Analysis');
  };

  // If we use this more than once it should be more generalized...
  $scope.clear_default_text = function() {
    $scope.new_route_name = '';
  };

  $scope.save_new_route = function() {
    var params = {
      name: $scope.new_route_name,
      area: {
        name: $scope.new_route_area_name,
        centroid: $scope.new_route_area_centroid,
        bounds: $scope.new_route_area_bounds,
      },
    };
    $http.post('/network_plan/create', params).success(function(response) {
      $scope.select_route(response);
      $('#new-route').modal('hide');
      $scope.load_plans();

      $scope.new_route_name = 'Untitled Analysis';
      $scope.new_route_area_name = '';
      $('#new-route select').select2('val', '');
      new_route_map.setCenter({lat: -34.397, lng: 150.644})
    });
  };

  $scope.save_as = function() {
    $scope.edit_route_name = $scope.route.name;
    $('#edit-route').modal('show');
  };

  $scope.save_changes = function() {
    $scope.route.name = $scope.edit_route_name;
    $http.post('/network_plan/'+$scope.route.id+'/save', $scope.route).success(function(response) {
      $('#edit-route').modal('hide');
    });
  };

  $scope.clear_route = function() {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover the deleted data!",
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, clear it!",
      showCancelButton: true,
      closeOnConfirm: true,
    }, function() {
      $rootScope.$broadcast('route_cleared', $scope.route);
      $http.post('/network_plan/'+$scope.route.id+'/clear').success(function(response) {
        // success
      });
    });
  };

  $scope.export_kml_name = function() {
    $('#export-route').modal('show');
  };

  $scope.export_kml = function() {
    var params = { name: $scope.kml_file_name };
    if(!params.name.match(/^[a-zA-Z0-9-_]+$/)){
      $('#export-error').show();
    }
    else{
      $('#export-error').hide();
      $('#export-route').modal('hide');

      location.href = '/network_plan/' + $scope.route.id + '/' + params.name + '/export';
    }
  };

  $scope.show_share_route = function(route) {
    $scope.shared_route = route;
    $('#share-route').modal('show');
    $('#share-route .modal-title').text('Share "'+route.name+'"');
    tracker.track('Manage Analyses / Share Analysis');
  };

  $scope.share_route = function() {
    $('#share-route').modal('hide');
    var params = {
      user_id: +$('#share-route-search').select2('val'), // will be removed in select2 4.1
      message: $('#share-route textarea').val(),
    }
    $http.post('/permissions/'+$scope.shared_route.id+'/grant', params).success(function(response) {
      swal({
        title:'Network plan shared successfully',
        type:'success'
      });
    });
  };

}]);
