/* global app $ map */
// Search Controller
app.controller('global-search-controller', ['$scope', '$rootScope', '$http', '$sce', 'map_tools' ,'$timeout', 'state', 'Utils', ($scope, $rootScope, $http, $sce, map_tools, $timeout, state, Utils) => {
  var ids = 0

  // We now need a plan ID in the search address url
  var searchControl = null

  // Update the search control every time that the plan changes.
  // state.plan.skip(1).subscribe((plan) => {
  //   searchControl.select2({placeholder: 'asdfasdf'})
  // })

  var addBouncingMarker = (latitude, longitude) => {
    var marker = new google.maps.Marker({
      map: map,
      animation: google.maps.Animation.BOUNCE,
      position: {lat: latitude, lng: longitude}
    });
    $timeout(() => marker.setMap(null), 5000);
  }

  // Initialize the select control. We need a plan ID before doing this.
  var initializeSelect = () => {
    searchControl = $('#global-search-toolbutton .select2')
    searchControl.select2({
      placeholder: 'Search an address, city, or state', // config.ui.default_form_values.create_plan.select_area_text,
      ajax: {
        url: `/search/addresses`,
        dataType: 'json',
        delay: 250,
        data: (searchTerm) => ({ text: searchTerm }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: 'id-' + (++ids),
              text: location.displayText,
              type: location.type,
              value: location.value
            }
          })
          if (items.length === 0) {
            items.push({
              id: 'id-' + (++ids),
              text: 'Search an address, city, or state',
              type: 'placeholder'
            })
          }
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
      var selectedLocation = e.added
      if (selectedLocation) {
        if (selectedLocation.type === 'placeId') {
          // This is a google maps place_id. The actual latitude/longitude can be obtained by another call to the geocoder
          var geocoder = new google.maps.Geocoder;
          geocoder.geocode({'placeId': selectedLocation.value}, function(results, status) {
            if (status !== 'OK') {
              console.error('Geocoder failed: ' + status);
              return
            }
            state.requestSetMapCenter.next({
              latitude: results[0].geometry.location.lat(),
              longitude: results[0].geometry.location.lng()
            })
            const ZOOM_FOR_LOCATION_SEARCH = 17
            state.requestSetMapZoom.next(ZOOM_FOR_LOCATION_SEARCH)
            addBouncingMarker(results[0].geometry.location.lat(), results[0].geometry.location.lng())
          })
        } else if (selectedLocation.type === 'latlng') {
          // The user has searched for a latitude/longitude. Simply go to that position
          throw 'TODO'
        }
      }
    })
  }

  initializeSelect()
}]);
