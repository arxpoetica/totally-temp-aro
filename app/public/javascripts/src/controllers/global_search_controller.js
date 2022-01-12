/* global app $ map */
// Search Controller
app.controller('global-search-controller', ['$scope', '$rootScope', '$http', '$sce', 'map_tools', '$timeout', 'state', 'Utils', ($scope, $rootScope, $http, $sce, map_tools, $timeout, state, Utils) => {
  var ids = 0

  // We now need a plan ID in the search address url
  var searchControl = null

  var addBouncingMarker = (latitude, longitude) => {
    var marker = new google.maps.Marker({
      map: map,
      animation: google.maps.Animation.BOUNCE,
      position: { lat: latitude, lng: longitude },
      optimized: !ARO_GLOBALS.MABL_TESTING,
    })
    $timeout(() => marker.setMap(null), 5000)
  }

  // Gets a session token for use in searching (which is, in turn, passed by the server to the Google Autocomplete API).
  // Per Googles docs, "A session consists of the activities required to resolve user input to a place".
  // So once the user selects a place, the session token should be regenerated.
  var searchSessionToken = Utils.getInsecureV4UUID()

  // Initialize the select control. We need a plan ID before doing this.
  var initializeSelect = () => {
    searchControl = $('#global-search-toolbutton .select2')
    searchControl.select2({
      placeholder: 'Search an address, city, or state', // config.ui.default_form_values.create_plan.select_area_text,
      ajax: {
        url: `/search/addresses`,
        dataType: 'json',
        quietMillis: 250, // *** In newer versions of select2, this is called 'delay'. Remember this when upgrading select2
        data: (searchTerm) => ({
          text: searchTerm,
          sessionToken: searchSessionToken,
          biasLatitude: state.defaultPlanCoordinates.latitude,
          biasLongitude: state.defaultPlanCoordinates.longitude
        }),
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
        searchSessionToken = Utils.getInsecureV4UUID()
        const ZOOM_FOR_LOCATION_SEARCH = 17
        if (selectedLocation.type === 'placeId') {
          // This is a google maps place_id. The actual latitude/longitude can be obtained by another call to the geocoder
          var geocoder = new google.maps.Geocoder()
          geocoder.geocode({ 'placeId': selectedLocation.value }, function (results, status) {
            if (status !== 'OK') {
              console.error('Geocoder failed: ' + status)
              return
            }
            state.requestSetMapCenter.next({
              latitude: results[0].geometry.location.lat(),
              longitude: results[0].geometry.location.lng()
            })
            state.requestSetMapZoom.next(ZOOM_FOR_LOCATION_SEARCH)
            addBouncingMarker(results[0].geometry.location.lat(), results[0].geometry.location.lng())
          })
        } else if (selectedLocation.type === 'latlng') {
          // The user has searched for a latitude/longitude. Simply go to that position
          state.requestSetMapCenter.next({
            latitude: +selectedLocation.value[0],
            longitude: +selectedLocation.value[1]
          })
          state.requestSetMapZoom.next(ZOOM_FOR_LOCATION_SEARCH)
          addBouncingMarker(+selectedLocation.value[0], +selectedLocation.value[1])
        } else if (selectedLocation.type === 'error') {
          console.error('ERROR when searching for location')
          console.error(selectedLocation)
        }
      }
    })
  }

  initializeSelect()
}])