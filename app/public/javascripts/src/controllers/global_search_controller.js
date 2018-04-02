/* global app $ map */
// Search Controller
app.controller('global-search-controller', ['$scope', '$rootScope', '$http', 'map_tools' ,'$timeout', 'state', ($scope, $rootScope, $http, map_tools, $timeout, state) => {
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
	console.log('CHANGED')
    var selected = e.added
    if (selected) {
      var centroid = selected.centroid.coordinates
      map.setCenter({ lat: centroid[1], lng: centroid[0] })
    }
  })
  
  // --- here or
  console.log(state)
  state.plan.subscribe((newPlan) => {
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
	if ('undefined' == typeof searchText) searchText = globalUser.default_location ? globalUser.default_location : config.ui.defaultSearch
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
        search.select2("val", loc, true)
      } else if ($scope.searchRetry < 5) {
        $scope.searchRetry++
        searchAddress(searchText)
      }

    });
  }
  
}]);
