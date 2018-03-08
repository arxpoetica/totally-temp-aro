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
      map: null
    })

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
    // Update the marker position and show it in the map
    this.targetMarker.position = position
    this.targetMarker.setMap(this.mapRef)
    this.controlState = this.controlStates.COMPUTING
    this.$timeout()
  }

  $ngDestroy() {
    google.maps.event.removeListener(this.clickListener)
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