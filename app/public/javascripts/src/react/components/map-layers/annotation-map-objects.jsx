/* globals google */
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import MapLayerActions from './map-layer-actions'

export class AnnotationMapObjects extends Component {
  constructor (props) {
    super(props)
    this.createdMapObjects = []
  }

  render () {
    return null // Everything is about map objects, nothing to render
  }

  componentDidMount () {
    // Set up the drawing manager
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.POLYGON]
      },
      polylineOptions: {
        editable: this.editable
      },
      polygonOptions: {
        fillColor: 'transparent',
        editable: this.editable
      }
    })
    this.drawingManager.setMap(this.props.googleMaps)

    this.overlayListener = google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (e) => {
      const geometryTypeMap = {
        polyline: 'Polyline',
        polygon: 'Polygon'
      }
      var geoJsonPolyline = {
        type: 'Feature',
        geometry: {
          type: geometryTypeMap[e.type],
          coordinates: e.overlay.getPath().getArray().map(point => [point.lng(), point.lat()])
        },
        properties: {}
      }
      const oldAnnotation = this.props.annotations[this.props.selectedAnnotationIndex]
      const newAnnotation = { ...oldAnnotation,
        geometry: oldAnnotation.geometry.concat(geoJsonPolyline)
      }
      this.props.updateAnnotation(this.props.selectedAnnotationIndex, newAnnotation)
      this.props.saveAnnotationsForUser(this.props.userId, this.props.annotations)
    })
  }

  componentWillUnmount () {
    google.maps.event.removeListener(this.overlayListener)
    this.drawingManager.setMap(null)
    this.createdMapObjects.forEach(mapObject => mapObject.setMap(null))
  }
}

AnnotationMapObjects.propTypes = {
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
  annotations: state.mapLayers.annotation.collections,
  selectedAnnotationIndex: state.mapLayers.annotation.selectedIndex,
  userId: state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  saveAnnotationsForUser: (userId, annotations) => dispatch(MapLayerActions.saveAnnotationsForUser(userId, annotations)),
  updateAnnotation: (index, annotation) => dispatch(MapLayerActions.updateAnnotation(index, annotation))
})

const AnnotationMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(AnnotationMapObjects)
export default AnnotationMapObjectsComponent
