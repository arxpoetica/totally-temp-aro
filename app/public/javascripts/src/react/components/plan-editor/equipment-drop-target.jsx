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

      let featureToCreate = {
        id: uuidStore.getUUID(),
        point: WktUtils.getWKTPointFromGoogleMapLatLng(dropLatLng),
      }
      
      if (networkNodeType === "undefined") {
        const featureCoordinates = featureToCreate.point.coordinates
        const polygonPath = [
          // type: 'polygon',
          // coordinates: [
            { lat: featureCoordinates[1], lng: featureCoordinates[0] - .0005 },
            { lat: featureCoordinates[1], lng: featureCoordinates[0] + .0005 },
            { lat: featureCoordinates[1] - .0005, lng: featureCoordinates[0] + .0005 },
            { lat: featureCoordinates[1] - .0005, lng: featureCoordinates[0] - .0005 }
          // ]
        ]

        const polygon = new google.maps.Polygon({
          objectId: featureToCreate.id, // Not used by Google Maps
          paths: polygonPath,
          clickable: true,
          draggable: false,
          editable: true,
          map: this.props.googleMaps,
          strokeColor: '#CC5500',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: 'white',
          fillOpacity: 0,
        })

        const constructionAreaMarker = new google.maps.Marker({
          position: new google.maps.LatLng(featureCoordinates[1], featureCoordinates[0]),
          icon: {
            url: '/images/map_icons/aro/edge_construction_area.png',
            anchor: new google.maps.Point(16, 30) // Anchor should be at the center of the crosshair icon
          },
          draggable: true,
          map: this.props.googleMaps
        })

        featureToCreate = {
          ...featureToCreate,
          // geometry: WktUtils.getWKTPolygonFromGoogleMapPath(polygon.getPath()),
          attributes: {},
          dataType: "edge_construction_area",
          // Needs to be updated to be a ternary based off of blocker and inclusion
          costMultiplier: .2,
          dateModified: Date.now(),
          egeConstructionTypeReference: {},
          edgeFeatureReferences: [],
          exportedAttributes: {},
          objectId: featureToCreate.id,
          // Needs to be updated to be a ternary based off of blocker and inclusion
          priority: 1
        }
        delete featureToCreate.id;
        delete featureToCreate.point;

        this.props.createConstructionArea(featureToCreate);
      } else {
        featureToCreate.networkNodeType = networkNodeType
        this.props.createFeature(featureToCreate)
      }
    }
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
  createConstructionArea: (constructionArea) => dispatch(PlanEditorActions.createConstructionArea(constructionArea)),
})

const EquipmentDropTargetComponent = wrapComponentWithProvider(reduxStore, EquipmentDropTarget, mapStateToProps, mapDispatchToProps)
export default EquipmentDropTargetComponent
