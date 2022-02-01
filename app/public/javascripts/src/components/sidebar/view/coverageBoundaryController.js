import ToolBarActions from '../../../react/components/header/tool-bar-actions'

class CoverageBoundaryController {
  constructor ($http, $timeout, state, $ngRedux) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.controlStates = Object.freeze({
      NO_TARGET_SELECTED: 'NO_TARGET_SELECTED',
      COMPUTING: 'COMPUTING',
      COMPUTED: 'COMPUTED'
    })
    this.controlState = this.controlStates.NO_TARGET_SELECTED
    this.coverageRadius = 10000 // In whatever units are specified in the configuration.units service
    this.householdsCovered = null
    this.targetMarker = new google.maps.Marker({
      position: new google.maps.LatLng(-122, 48),
      icon: {
        url: '/images/map_icons/aro/coverage_target.png',
        anchor: new google.maps.Point(16, 16) // Anchor should be at the center of the crosshair icon
      },
      draggable: true,
      map: null,
      optimized: !ARO_GLOBALS.MABL_TESTING,
    })
    this.targetMarker.addListener('dragend', (event) => {
      this.handleCoverageTargetUpdated(event.latLng)
    })

    this.coveragePolygon = null
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: The Coverage Boundary component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    // Use the cross hair cursor while this control is initialized
    this.mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Handler for map click
    var self = this
    this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function (event) {
      self.handleCoverageTargetUpdated(event.latLng)
    })
  }

  handleCoverageTargetUpdated (position) {
    // If we are still processing a previous click, do nothing
    if (this.controlState === this.controlStates.COMPUTING) {
      console.warn('Warning: A coverage boundary computation is in process. Ignoring handleCoverageTargetUpdated')
      return
    }

    // Update the marker position and show it in the map
    this.targetMarker.position = position
    this.targetMarker.setMap(this.mapRef)
    this.targetMarker.setDraggable(false) // No dragging while we are computing coverage
    this.controlState = this.controlStates.COMPUTING
    if (this.coveragePolygon) {
      this.coveragePolygon.setMap(null)
    }
    this.householdsCovered = null

    this.calculateCoverage()
      .then((result) => {
        // Draw the polygon onto the screen
        this.coveragePolygon = new google.maps.Polygon({
          paths: result.coveragePolygon,
          strokeColor: '#FF1493',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF1493',
          fillOpacity: 0.4,
          clickable: false
        })
        this.coveragePolygon.setMap(this.mapRef)
        this.householdsCovered = result.householdsCovered
        this.controlState = this.controlStates.COMPUTED
        this.targetMarker.setDraggable(true) // Allow dragging the marker
        this.$timeout()
      })
      .catch((err) => {
        console.error(err)
        this.targetMarker.setDraggable(true) // Allow dragging the marker
      })

    this.$timeout()
  }

  calculateCoverage () {
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [this.targetMarker.position.lng(), this.targetMarker.position.lat()]
    }
    // Always send radius in meters to the back end
    optimizationBody.radius = this.coverageRadius * this.state.configuration.units.length_units_to_meters

    return this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then((result) => {
        // Format the result so we can use it to create a polygon
        var polygonPath = []
        result.data.polygon.coordinates[0].forEach((polygonVertex) => {
          polygonPath.push({
            lat: polygonVertex[1],
            lng: polygonVertex[0]
          })
        })
        return Promise.resolve({
          householdsCovered: result.data.coverageInfo.length,
          coveragePolygon: polygonPath
        })
      })
      .catch((err) => console.error(err))
  }

  $onDestroy () {
    // Remove the click event listener that we registered
    google.maps.event.removeListener(this.clickListener)

    // Remove the coverage polygon that we had created
    if (this.coveragePolygon) {
      this.coveragePolygon.setMap(null)
    }

    // Remove the marker we created
    this.targetMarker.setMap(null)

    // Go back to the default map cursor
    this.mapRef.setOptions({ draggableCursor: null })

    // Set mapRef to null, in case any async code is running that will draw polygons on the map
    this.mapRef = null

    // Target selection mode cannot be COVERAGE_BOUNDARY anymore
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.SINGLE_PLAN_TARGET
    //this.rSelectedTargetSelectionModeAction(this.state.targetSelectionModes.SINGLE_PLAN_TARGET)
  }

  mapDispatchToTarget (dispatch) {
    return {
      rSelectedTargetSelectionModeAction: (value) => dispatch(ToolBarActions.selectedTargetSelectionMode(value))
    }
  }
}

CoverageBoundaryController.$inject = ['$http', '$timeout', 'state', '$ngRedux']

export default CoverageBoundaryController
