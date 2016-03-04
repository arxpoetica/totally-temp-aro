/* global app $ _ map google */
// Search Controller
app.controller('search-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.route = null
  $scope.search_results = null

  var search = $('#search_controller input')
  search.select2({
    ajax: {
      url: '/search',
      dataType: 'json',
      delay: 250,
      data: (term) => ({ text: term }),
      results: (data, params) => {
        var items = data.map((location) => {
          return {
            id: String(location.location_id),
            text: location.name,
            geog: location.geog
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
  })

  search.on('change', () => {
    var value = search.select2('val')
    var location = _.findWhere($scope.search_results, { id: value })
    var center = { lat: location.geog.coordinates[1], lng: location.geog.coordinates[0] }
    map.setCenter(center)

    var marker = new google.maps.Marker({
      position: center,
      map: map,
      animation: google.maps.Animation.DROP
    })

    google.maps.event.addListener(marker, 'click', (event) => {
      $rootScope.$broadcast('open_location', location.id)
    })
  })
}])
