/* global app $ map */
// Search Controller
app.controller('global-search-controller', ['$scope', '$rootScope', '$http', '$sce', 'map_tools' ,'$timeout', 'state', 'Utils', ($scope, $rootScope, $http, $sce, map_tools, $timeout, state, Utils) => {
  var ids = 0

  // We now need a plan ID in the search address url
  var planId = null
  var planInfo = null
  var searchControl = null

  // Update the search control every time that the plan changes.
  state.plan.skip(1).subscribe((plan) => {
    if (!planId) {
      planInfo = plan
      planId = plan.id
      // Initialize select2 and search address only the first time
      initializeSelect()
      $timeout(() => searchAddress(plan.areaName), 10)
    }
    planInfo = plan    
    planId = plan.id
  })

  // Initialize the select control. We need a plan ID before doing this.
  var initializeSelect = () => {
    searchControl = $('#global-search-toolbutton .select2')
    searchControl.select2({
      placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
      initSelection : function (select, callback) {
        callback($scope.firstLocation)
      },
      ajax: {
        url: `/search/addresses/${planId}?userId=${state.loggedInUser.id}`,
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
  }

  function searchAddress (searchText) {
    if (!searchControl) {
      console.warn('Search control not yet initialized')
      return
    }
    //place map to user's default location for ephemeral plan 
    if ('undefined' == typeof searchText || planInfo.ephemeral) {
      searchText = state.loggedInUser.default_location ? state.loggedInUser.default_location : config.ui.defaultSearch
    }
    const searchUrl = `/search/addresses/${planId}?userId=${state.loggedInUser.id}`
    $http.get(searchUrl, { params: { text: searchText } })
      .then(function (results) {
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
          searchControl.select2("val", loc, true)
        }
      })
      .catch((err) => console.error(err))
  }
}]);
