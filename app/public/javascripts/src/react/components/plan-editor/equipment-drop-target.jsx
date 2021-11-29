import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { constants } from './shared'
import MapUtils from '../../common/map-utils'
import uuidStore from '../../../shared-utils/uuid-store'
import PlanEditorActions from './plan-editor-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import './equipment-drop-target.css'
import ViewSettingsActions from '../view-settings/view-settings-actions'

export class EquipmentDropTarget extends Component {
  constructor (props) {
    super(props)
    this.dropTarget = null
    this.setDropTargetRef = this.setDropTargetRef.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
  }

  render () {
    return this.props.isDraggingFeatureForDrop
      ? <div>
        <div
          className='equipment-drop-target'
          onDrop={this.handleDrop}
          onDragOver={event => event.preventDefault()}
          ref={this.setDropTargetRef}
        />
        <div className='equipment-drop-target-help'>
          Drop feature on map to create...
        </div>
      </div>
      : null
  }

  setDropTargetRef (element) {
    this.dropTarget = element
  }

  handleDrop (event) {
    const entityBeingDropped = event.dataTransfer.getData(constants.DRAG_DROP_ENTITY_KEY)
    if (entityBeingDropped === constants.DRAG_DROP_NETWORK_EQUIPMENT) {
      // A network equipment item was dropped. Handle it.
      event.stopPropagation()
      event.preventDefault()
      // Convert pixels to latlng
      const grabOffsetX = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_OFFSET_X)
      const grabOffsetY = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_OFFSET_Y)
      const grabImageW = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_ICON_W)
      const grabImageH = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_ICON_H)
      const offsetX = (grabImageW * 0.5) - grabOffsetX // center
      const offsetY = grabImageH - grabOffsetY // bottom
      const dropLatLng = MapUtils.pixelToLatlng(this.props.googleMaps, event.clientX + offsetX, event.clientY + offsetY)
      const networkNodeType = event.dataTransfer.getData(constants.DRAG_DROP_ENTITY_DETAILS_KEY)

      const featureToCreate = {
        id: uuidStore.getUUID(),
        point: WktUtils.getWKTPointFromGoogleMapLatLng(dropLatLng),
        networkNodeType: networkNodeType,
      }
      this.props.createFeature(featureToCreate)
    } else if (entityBeingDropped === constants.DRAG_IS_BOUNDARY) {
      var grabOffsetX = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_OFFSET_X)
      var grabOffsetY = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_OFFSET_Y)
      var grabImageW = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_ICON_W)
      var grabImageH = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_ICON_H)
      var offsetX = (grabImageW * 0.5) - grabOffsetX // center
      var offsetY = grabImageH - grabOffsetY // bottom
  
      var dropLatLng = MapUtils.pixelToLatlng(this.props.googleMaps, event.clientX + offsetX, event.clientY + offsetY)
      var position = new google.maps.LatLng(dropLatLng.lat(), dropLatLng.lng())
      var radius = (40000 / Math.pow(2, this.props.googleMaps.getZoom())) * 2 * 256 // radius in meters
      var path = this.generateHexagonPath(position, radius)
      var feature = {
        objectId: uuidStore.getUUID(),
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[path]]
        },
        isExistingObject: false
      }
      this.props.createMultiPolygon(feature)
    }
  }

  generateHexagonPath (position, radius) {
    var pathPoints = []
    for (var angle = -90; angle < 270; angle += 60) {
      var point = google.maps.geometry.spherical.computeOffset(position, radius, angle)
      pathPoints.push([point.lng(), point.lat()])
    }
    pathPoints.push(pathPoints[0]) // Close the polygon
    return pathPoints
  }
}

EquipmentDropTarget.propTypes = {
  isDraggingFeatureForDrop: PropTypes.bool,
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  isDraggingFeatureForDrop: state.planEditor.isDraggingFeatureForDrop,
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  createFeature: (equipment) => dispatch(PlanEditorActions.createFeature(equipment)),
  createMultiPolygon: (feature) => dispatch(ViewSettingsActions.createMultiPolygon(feature)),
})

const EquipmentDropTargetComponent = wrapComponentWithProvider(reduxStore, EquipmentDropTarget, mapStateToProps, mapDispatchToProps)
export default EquipmentDropTargetComponent
