/* globals google */
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
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
        editable: true
      },
      polygonOptions: {
        fillColor: 'transparent',
        editable: true
      }
    })
    this.drawingManager.setMap(this.props.googleMaps)

    this.overlayListener = google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (e) => {
      var geometry = null
      if (e.type === 'polyline') {
        geometry = WktUtils.getWKTLineStringFromGoogleMapPath(e.overlay.getPath())
      } else if (e.type === 'polygon') {
        geometry = WktUtils.getWKTPolygonFromGoogleMapPath(e.overlay.getPath())
      }
      var geoJsonPolyline = {
        type: 'Feature',
        geometry: geometry,
        properties: {}
      }
      const oldAnnotation = this.props.annotations[this.props.selectedAnnotationIndex]
      const newAnnotation = { ...oldAnnotation,
        geometries: oldAnnotation.geometries.concat(geoJsonPolyline)
      }
      this.props.updateAnnotation(this.props.selectedAnnotationIndex, newAnnotation)
      this.props.saveAnnotationsForUser(this.props.userId, this.props.annotations)
      e.overlay.setMap(null)  // Why? Because all map objects in the redux state will be created later
    })
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (this.props.annotations !== prevProps.annotations && this.props.annotations && this.props.annotations.length > 0) {
      // Remove all old features from data layer
      this.createdMapObjects.forEach(mapObject => mapObject.setMap(null))
      // Annotations have changed. Create map objects
      this.props.annotations[0].geometries.forEach(geoJson => {
        if (geoJson.geometry.type === 'LineString') {
          const mapObject = new google.maps.Polyline({
            path: WktUtils.getGoogleMapPathsFromWKTLineString(geoJson.geometry),
            editable: true,
            map: this.props.googleMaps
          })
          this.createdMapObjects.push(mapObject)
        } else if (geoJson.geometry.type === 'Polygon') {
          const mapObject = new google.maps.Polygon({
            path: WktUtils.getGoogleMapPathsFromWKTPolygon(geoJson.geometry),
            editable: true,
            map: this.props.googleMaps
          })
          this.createdMapObjects.push(mapObject)
        } else {
          console.warn(`Annotations: Unknown type ${geoJson.geometry.type}`)
        }
      })
    }

    if ((this.props.annotations !== prevProps.annotations) || (this.props.maxGeometries !== prevProps.maxGeometries)) {
      // Disable drawing manager if we have too many geometries
      var drawingMode = google.maps.drawing.OverlayType.POLYLINE
      const numGeometries = this.props.annotations[0] ? this.props.annotations[0].geometries.length : 0
      if (numGeometries >= this.props.maxGeometries) {
        drawingMode = null
      }
      this.drawingManager.setOptions({
        drawingMode,
        drawingControl: numGeometries < this.props.maxGeometries
      })
    }
  }

  componentWillUnmount () {
    google.maps.event.removeListener(this.overlayListener)
    this.drawingManager.setMap(null)
    this.createdMapObjects.forEach(mapObject => mapObject.setMap(null))
  }
}

AnnotationMapObjects.propTypes = {
  googleMaps: PropTypes.object,
  maxGeometries: PropTypes.number,
  annotations: PropTypes.array,
  selectedAnnotationIndex: PropTypes.number,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
  maxGeometries: state.mapLayers.annotation.maxGeometries,
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
