// Selected location controller
app.controller('selected_location_controller', function($rootScope, $scope, $http) {
  $scope.location = {};
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0;

  $scope.select_random_location = function() {
    var map_layer = $rootScope.feature_layers.locations;
    var feature;
    map_layer.data_layer.forEach(function(f) {
      feature = feature || f;
    });
    var options = {
      add: function(text, func) {
        if (text === 'See more information') {
          func(map_layer, feature);
        }
      }
    };
    $rootScope.$broadcast('contextual_menu_feature', options, map_layer, feature);
  };

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'locations') return;
    options.add('See more information', function(map_layer, feature) {
      var id = feature.getProperty('id');
      $http.get('/locations/'+id+'/show').success(function(response) {
        console.log('show_households', $scope.show_households)
        set_selected_location(response);
        $('#selected_location_controller').modal('show');
      });
    });
  });

  $scope.update = function() {
    var location = $scope.location
    var location_id = location.location_id;
    $http.post('/locations/'+location_id+'/update', {
      number_of_households: location.number_of_households,
    }).success(function(response) {
      $('#selected_location_controller').modal('hide');
    })
  }

  function set_selected_location(location) {
    location.total_costs = location.entry_fee
                          + location.household_install_costs * location.number_of_households
                          + location.business_install_costs * location.number_of_businesses;
    $scope.location = location;
  };

  $('#selected_location_controller .nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  })

});
