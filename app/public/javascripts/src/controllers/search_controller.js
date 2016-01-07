// Search Controller
app.controller('search-controller', ['$scope', '$rootScope', '$http', 'map_tools', function($scope, $rootScope, $http, map_tools) {
  // Controller instance variables
  $scope.map_tools = map_tools;
  $scope.route = null;
  $scope.search_results = null;

  /************
  * FUNCTIONS *
  *************/

  var search = $('#search_controller input')
  search.select2({
    ajax: {
      url: '/search',
      dataType: 'json',
      delay: 250,
      data: function (term) {
        return {
          text: term
        };
      },
      results: function (data, params) {
        var items = data.map(function(location) {
          return {
            id: String(location.location_id),
            text: location.name,
            geog: location.geog,
          }
        });
        $scope.search_results = items;

        return {
          results: items,
          pagination: {
            more: false,
          }
        };
      },
      cache: true
    },
  })

  search.on('change', function() {
    var value = search.select2('val');
    var location = _.findWhere($scope.search_results, { id: value });
    var center = { lat: location.geog.coordinates[1], lng: location.geog.coordinates[0] };
    map.setCenter(center);

    var marker = new google.maps.Marker({
      position: center,
      map: map,
      animation: google.maps.Animation.DROP,
    });

    google.maps.event.addListener(marker, 'click', function(event) {
      $rootScope.$broadcast('open_location', location.id);
    })
  })

}]);
