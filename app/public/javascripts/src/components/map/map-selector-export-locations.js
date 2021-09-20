import { updateDrawingManagerState } from '../../shared-utils/utilities'
class MapSelectorExportLocationsController {
  constructor ($document, $http, state, Utils, $ngRedux) {
    this.mapRef = null
    this.drawingManager = null
    this.document = $document
    this.$http = $http
    this.state = state
    this.Utils = Utils

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    // Hold display mode and selection mode variables from application state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((newValue) => {
      this.selectedDisplayMode = newValue
      this.targetSelectionMode = this.state && (this.state.selectedTargetSelectionMode || this.rSelectedTargetSelectionMode)
      updateDrawingManagerState(this.drawingManager, this.selectedDisplayMode, this.targetSelectionMode, this.state, this.displayModes, this.mapRef)
    })
  }

  $onDestroy () {
    if (this.unsub) { this.unsub.unsubscribe() }

    if (this.drawingManager) {
      this.drawingManager.setDrawingMode('marker')
      this.drawingManager.setMap(null)
    }
  }

  exportLocationsByPolygon (polygon) {
    if (this.state.isRulerEnabled || this.rIsRulerEnabled) return // disable any click action when ruler is enabled

    var area = google.maps.geometry.spherical.computeArea(polygon)
    if (area > this.state.MAX_EXPORTABLE_AREA) {
      return swal({
        title: 'Error',
        text: 'Polygon too big to export',
        type: 'error'
      })
    }

    var planId = this.state.plan.id
    var points = []
    for (var polyI = 0; polyI < polygon.length; polyI++) {
      var pt = polygon[polyI]
      points[polyI] = [pt.lng(), pt.lat()]
    }
    points.push(points[0])

    // Run the export endpoint
    this.$http.post('/locations/exportRegion', { 'polygon': points, 'planId': planId })
      .then((r) => {
        if (r.data === '') {
          return swal({
            title: 'Error',
            text: 'No data returned',
            type: 'error'
          })
        }

        this.Utils.downloadFile(r.data, 'exported_locations.csv')
      })
      .catch((err) => console.error(err))
  }

  $onInit () {
    this.document.ready(() => {
      this.doInit()
    })
  }

  doInit () {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }

    // We should have a map variable at this point
    this.mapRef = window[this.mapGlobalObjectName]

    // Create a drawing manager that will be used for marking out polygons for selecting entities
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false
    })

    this.drawingManager.addListener('overlaycomplete', (e) => {
      if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.POLYGON_EXPORT_TARGET || this.rSelectedTargetSelectionMode === this.state.targetSelectionModes.POLYGON_EXPORT_TARGET) {
        this.exportLocationsByPolygon(e.overlay.getPath().getArray())
      }
      setTimeout(() => e.overlay.setMap(null), 100)
    })
  }

  $doCheck () {
    // Do a manual check on selectedTargetSelectionMode, as it is no longer a BehaviorSubject
    var oldValue = this.targetSelectionMode
    this.targetSelectionMode = this.state.selectedTargetSelectionMode || this.rSelectedTargetSelectionMode
    if (this.targetSelectionMode !== oldValue) {
      updateDrawingManagerState(this.drawingManager, this.selectedDisplayMode, this.targetSelectionMode, this.state, this.displayModes, this.mapRef)
    }
  }

  mapStateToThis (reduxState) {
    return {
      rSelectedTargetSelectionMode: reduxState.toolbar.selectedTargetSelectionMode,
      rIsRulerEnabled: reduxState.toolbar.isRulerEnabled
    }
  }
}

MapSelectorExportLocationsController.$inject = ['$document', '$http', 'state', 'Utils', '$ngRedux']

let mapSelectorExportLocation = {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorExportLocationsController
}

export default mapSelectorExportLocation
