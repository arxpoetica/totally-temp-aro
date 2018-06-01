/* global app $ map */
// Search Controller
app.controller('global-search-controller', ['$scope', '$rootScope', '$http', 'map_tools' ,'$timeout', 'state', 'Utils', ($scope, $rootScope, $http, map_tools, $timeout, state, Utils) => {
  var ids = 0
  var search = $('#global-search-toolbutton .select2')
  search.select2({
    placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
    initSelection : function (select, callback) {
      callback($scope.firstLocation)
    },
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
            centroid: location.centroid,
            type: location.type
          }
        })
        $scope.search_results = items
        $scope.userSearch = true
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
      var centroid = selected.centroid.coordinates
      map.setCenter({ lat: centroid[1], lng: centroid[0] })

      if($scope.userSearch) {
        const pointSearchZoom = 17

        $timeout( function(){
          var marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.BOUNCE,
            position: {lat: centroid[1], lng: centroid[0]}
          });
          $timeout( function(){
            marker.setMap(null);
          }, 5000 );
        }, 1000 );

        map.setZoom(pointSearchZoom)
      }
    }
  })
  
  
  state.requestSetLocation.subscribe((newPlan) => {
	  if (newPlan && !newPlan.ephemeral){
	  searchAddress(newPlan.areaName)
    }
  })
  
  
  
  //set the default search to the location in config
  $timeout(function () {
    $scope.searchRetry = 0
    searchAddress()
  },10);

  function searchAddress (searchText) {
	if ('undefined' == typeof searchText) searchText = state.loggedInUser.default_location ? state.loggedInUser.default_location : config.ui.defaultSearch
	$http.get("/search/addresses", { params: { text: searchText } }).then(function (results) {

      var location = results.data[0];

      if (location != null) {
        var loc = {
          id: 'id-' + (++ids),
          text: location.name,
          bounds: location.bounds,
          centroid: location.centroid
        };
        $scope.firstLocation = loc;
        $scope.userSearch = false
        search.select2("val", loc, true)
      } else if ($scope.searchRetry < 5) {
        $scope.searchRetry++
        searchAddress(searchText)
      }

    });
  }
  
}]);
