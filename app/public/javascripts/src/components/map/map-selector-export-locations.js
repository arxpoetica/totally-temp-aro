class MapSelectorExportLocationsController {
  constructor($document, $http, state) {

    this.mapRef = null
    this.drawingManager = null

    // Hold display mode and selection mode variables from application state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((newValue) => {
      this.selectedDisplayMode = newValue
      this.updateDrawingManagerState()
    })
    this.state = state
    this.selectionModes = state.selectionModes

    // Handle selection events from state
    this.unsub = state.mapFeaturesSelectedEvent.subscribe((event) => {
    	if( angular.equals(event, {}) || event.locations.length  === 0){
    	  return
      }

      if(event.area > state.MAX_EXPORTABLE_AREA) {
        return swal({
          title: 'Error',
          text: 'Polygon too big to export',
          type: 'error'
        })
      }

      let locationIds = event.locations.map((l)=>{
        return l.location_id
      })

      ///Run the export endpoint
      $http.post("/locations/exportRegion", {'locations': locationIds}).then((r)=>{
        if(r.data === ""){
          return swal({
            title: 'Error',
            text: 'No data returned',
            type: 'error'
          })
        }
        downloadCSV(r.data)
      })
    })

  }

  $onDestroy() {
    if(this.unsub)
      this.unsub.unsubscribe()

    if(this.drawingManager) {
      this.drawingManager.setDrawingMode(null)
      this.drawingManager.setMap(null)
    }
  }

  updateDrawingManagerState() {
    if (!this.drawingManager) {
      return
    }

    if ((this.selectedDisplayMode === this.displayModes.ANALYSIS || this.selectedDisplayMode === this.displayModes.VIEW)
        && this.targetSelectionMode === this.state.targetSelectionModes.POLYGON_EXPORT_TARGET) {
      this.drawingManager.setDrawingMode('polygon')
      this.drawingManager.setMap(this.mapRef)
    } else {
      this.drawingManager.setDrawingMode(null)
      this.drawingManager.setMap(null)
    }

  }

  $onInit() {
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
      this.state.requestPolygonSelect.next({
        coords: e.overlay.getPath().getArray()
      })
      setTimeout(() => e.overlay.setMap(null), 100)
    })
  }

  $doCheck() {
    // Do a manual check on selectedTargetSelectionMode, as it is no longer a BehaviorSubject
    var oldValue = this.targetSelectionMode
    this.targetSelectionMode = this.state.selectedTargetSelectionMode
    if (this.targetSelectionMode !== oldValue) {
      this.updateDrawingManagerState()
    }
  }
}


function downloadCSV(data) {
  var csvContent = "data:text/csv;charset=utf-8," + data.toString();
  var a = document.createElement('a');
  a.href = csvContent
  a.setAttribute('download', "exported_locations.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

MapSelectorExportLocationsController.$inject = ['$document', '$http', 'state']

let mapSelectorExportLocation = {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorExportLocationsController
}

export default mapSelectorExportLocation