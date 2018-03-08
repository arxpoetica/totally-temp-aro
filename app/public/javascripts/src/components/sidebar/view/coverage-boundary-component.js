class CoverageBoundaryController {

  constructor($timeout) {
    this.$timeout = $timeout
    this.controlStates = Object.freeze({
      NO_TARGET_SELECTED: 'NO_TARGET_SELECTED',
      COMPUTING: 'COMPUTING',
      COMPUTED: 'COMPUTED'
    })
    this.controlState = this.controlStates.NO_TARGET_SELECTED
    this.householdsCovered = null
    this.targetMarker = new google.maps.Marker({
      position: new google.maps.LatLng(-122, 48),
      icon: '/images/map_icons/aro/households_default.png',
      clickable: false,
      map: null
    })
    this.coveragePolygon = null
  }

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: The Coverage Boundary component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    // Handler for map click
    var self = this
    this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function(event) {
      self.handleCoverageTargetUpdated(event.latLng)
    });
  }

  handleCoverageTargetUpdated(position) {

    // If we are still processing a previous click, do nothing
    if (this.controlState === this.controlStates.COMPUTING) {
      console.warn('Warning: A coverage boundary computation is in process. Ignoring mouse click')
      return
    }

    // Update the marker position and show it in the map
    this.targetMarker.position = position
    this.targetMarker.setMap(this.mapRef)
    this.controlState = this.controlStates.COMPUTING
    if (this.coveragePolygon) {
      this.coveragePolygon.setMap(null)
    }
    this.householdsCovered = null

    this.mockCoverageCalculation()
    .then((result) => {
      // Draw the polygon onto the screen
      this.coveragePolygon = new google.maps.Polygon({
        paths: result.data.geometry,
        strokeColor: '#A00000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#A00000',
        fillOpacity: 0.4,
        clickable: false
      })
      this.coveragePolygon.setMap(this.mapRef)
      this.householdsCovered = result.data.householdsCovered
      this.controlState = this.controlStates.COMPUTED
      this.$timeout()
    })
    .catch((err) => console.error(err))

    this.$timeout()
  }

  $onDestroy() {
    google.maps.event.removeListener(this.clickListener)
    if (this.coveragePolygon) {
      this.coveragePolygon.setMap(null)
    }
    this.targetMarker.setMap(null)
  }

  mockCoverageCalculation() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        var latCen = this.targetMarker.position.lat()
        var lngCen = this.targetMarker.position.lng()
        var outerRadius = 0.02 // In lat/lng coordinates
        var innerRadius = outerRadius / 3.0 // For random variation in the shape

        var geometry = []
        for (var angle = 0.0; angle < Math.PI * 2.0; angle += (4.0 * Math.PI / 180.0)) {
          var radius = outerRadius + (innerRadius * Math.random())
          var lat = latCen + radius * Math.cos(angle)
          var lng = lngCen + radius * Math.sin(angle)
          geometry.push({
            lat: lat,
            lng: lng
          })
        }

        resolve({
          data: {
            householdsCovered: Math.round(Math.random() * 10000),
            geometry: geometry
          }
        })
      }, 5000)
    })
  }
}

CoverageBoundaryController.$inject = ['$timeout']

app.component('coverageBoundary', {
  templateUrl: '/components/sidebar/view/coverage-boundary-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: CoverageBoundaryController
})