/* globals google */
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import uuidStore from '../../../shared-utils/uuid-store'

export class BoundaryDrawCreator extends Component {

  componentWillMount () {
    // Create a drawing manager
    const boundaryPolygonOptions = {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF1493',
      fillOpacity: 0.4
    }
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: boundaryPolygonOptions
    })
    this.drawingManager.setMap(this.props.googleMaps)
    const self = this
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', event => {
      // Create a boundary object.
      var boundaryFeature = {
        objectId: uuidStore.getUUID(),
        geometry: {
          type: 'Polygon',
          coordinates: []
        },
        dataType: 'equipment_boundary',
        attributes: {
          network_node_object_id: self.props.isDrawingBoundaryFor
        }
      }
      event.overlay.getPaths().forEach((path) => {
        var pathPoints = []
        path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
        pathPoints.push(pathPoints[0]) // Close the polygon
        boundaryFeature.geometry.coordinates.push(pathPoints)
      })

      // Check if polygon is valid, if valid create a map object
      self.props.stopDrawingBoundary()
      var isValidPolygon = true // TODO: FIX MapUtilities.isPolygonValid({ type: 'Feature', geometry: boundaryFeature.geometry })
      if (isValidPolygon) {
        self.props.createEquipmentBoundary(self.props.transactionId, boundaryFeature)
      } else {
        console.error('Invalid polygon. Boundary will not be created.')
      }

      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
    })
  }

  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentWillUnmount () {
    this.drawingManager.setMap(null)
    this.drawingManager = null
  }
}

BoundaryDrawCreator.propTypes = {
  transactionId: PropTypes.number,
  isDrawingBoundaryFor: PropTypes.string,
  googleMaps: PropTypes.object
}

const mapStateToProps = (state) => ({
  transactionId: state.planEditor.transaction.id,
  isDrawingBoundaryFor: state.planEditor.isDrawingBoundaryFor,
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  createEquipmentBoundary: (transactionId, feature) => dispatch(PlanEditorActions.createEquipmentBoundary(transactionId, feature)),
  stopDrawingBoundary: () => dispatch(PlanEditorActions.stopDrawingBoundary())
})

const BoundaryDrawCreatorComponent = connect(mapStateToProps, mapDispatchToProps)(BoundaryDrawCreator)
export default BoundaryDrawCreatorComponent
