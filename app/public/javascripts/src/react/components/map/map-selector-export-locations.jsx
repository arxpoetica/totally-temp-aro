import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import AroHttp from '../../common/aro-http'
import { saveAs } from 'file-saver'

const MAX_EXPORTABLE_AREA = 11000000000
// Create a drawing manager that will be used for marking out polygons for selecting entities
const drawingManager = new google.maps.drawing.DrawingManager({
  drawingMode: null,
  drawingControl: false,
})

const MapSelectorExportLocations = (props) => {
  const { mapRef, planId, isRulerEnabled } = props

  useEffect(() => {
    updateDrawingManagerState(drawingManager, 'polygon', mapRef)

    drawingManager.addListener('overlaycomplete', (event) => {
      exportLocationsByPolygon(event.overlay.getPath().getArray())
      setTimeout(() => event.overlay.setMap(null), 100)
    })

    return () => {
      if (drawingManager) { updateDrawingManagerState(drawingManager, 'marker', null) }
    }
  }, [])

  const updateDrawingManagerState = (drawingManager, drawingMode, mapRef) => {
    drawingManager.setDrawingMode(drawingMode)
    drawingManager.setMap(mapRef)
  }

  const exportLocationsByPolygon = (polygon) => {
    if (isRulerEnabled) { return } // disable any click action when ruler is enabled

    const area = google.maps.geometry.spherical.computeArea(polygon)
    if (area > MAX_EXPORTABLE_AREA) {
      return swal({
        title: 'Error',
        text: 'Polygon too big to export',
        type: 'error',
      })
    }

    const points = []
    for (let polyI = 0; polyI < polygon.length; polyI++) {
      const pt = polygon[polyI]
      points[polyI] = [pt.lng(), pt.lat()]
    }
    points.push(points[0])

    // Run the export endpoint
    AroHttp.post('/locations/exportRegion', { polygon: points, planId }, { responseType: 'arraybuffer' })
      .then((result) => {
        if (result === '') {
          return swal({
            title: 'Error',
            text: 'No data returned',
            type: 'error',
          })
        }
        saveAs(new Blob([result]), 'exported_locations.csv')
      })
      .catch((err) => console.error(err))
  }

  // No UI for this component. It deals with map objects only.
  return null
}

const mapStateToProps = (state) => ({
  isRulerEnabled: state.toolbar.isRulerEnabled,
  mapRef: state.map.googleMaps,
  planId: state.plan && state.plan.activePlan && state.plan.activePlan.id,
})

export default connect(mapStateToProps, null)(MapSelectorExportLocations)
