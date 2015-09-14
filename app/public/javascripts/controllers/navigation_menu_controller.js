// Navigation Menu Controller
app.controller('navigation_menu_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'selection', '$location', function($scope, $rootScope, $http, map_tools, selection, $location) {
  // Controller instance variables
  $scope.selection = selection;
  $scope.new_route_name = 'Untitled plan';
  $scope.new_route_area_name = '';
  $scope.new_route_area_centroid;
  $scope.new_route_area_bounds;
  $scope.edit_route_name;

  $scope.shared_route;

  $scope.route = null;
  $scope.routes = [];

  $scope.user_id = user_id;

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
  };

  $scope.delete_route = function(route) {
    if (!route) return;

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
      $http.post('/route_optimizer/'+route.id+'/delete').success(function(response) {
        $scope.load_routes();
      });
    });
  };

  $scope.load_routes = function(callback) {
    $http.get('/route_optimizer/find_all').success(function(response) {
      $scope.routes = response;
      callback && callback();
    });
  };

  // load plan depending on the URL
  var path = $location.path();
  if (path.indexOf('/plan/') === 0) {
    var plan_id = +path.substring('/plan/'.length);
    $scope.load_routes(function() {
      var route = _.findWhere($scope.routes, { id: plan_id });
      if (route) {
        $scope.select_route(route);
      }
    });
  }

  $scope.show_routes = function() {
    $scope.load_routes(function() {
      $('#select-route').modal('show');
    });
  };

  $scope.manage_network_plans = function() {
    $scope.load_routes(function() {
      $('#manage-network-plans').modal('show');
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
    $http.post('/route_optimizer/create', params).success(function(response) {
      $scope.select_route(response);
      $('#new-route').modal('hide');
      $scope.load_routes();
    });
  };

  $scope.save_as = function() {
    $scope.edit_route_name = $scope.route.name;
    $('#edit-route').modal('show');
  };

  $scope.save_changes = function() {
    $scope.route.name = $scope.edit_route_name;
    $http.post('/route_optimizer/'+$scope.route.id+'/save', $scope.route).success(function(response) {
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
      $http.post('/route_optimizer/'+$scope.route.id+'/clear').success(function(response) {
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
    
      location.href = '/route_optimizer/' + $scope.route.id + '/' + params.name + '/export';
    }
  };

  $scope.show_share_route = function(route) {
    $scope.shared_route = route;
    $('#share-route').modal('show');
    $('#share-route .modal-title').text('Share "'+route.name+'"');
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
