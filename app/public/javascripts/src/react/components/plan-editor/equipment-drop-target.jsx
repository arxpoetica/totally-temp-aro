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
import { isEquipmentInsideBoundary } from './shared'

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
    // Convert pixels to latlng
    const grabOffsetX = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_OFFSET_X)
    const grabOffsetY = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_OFFSET_Y)
    const grabImageW = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_ICON_W)
    const grabImageH = event.dataTransfer.getData(constants.DRAG_DROP_GRAB_ICON_H)
    const offsetX = (grabImageW * 0.5) - grabOffsetX // center
    const offsetY = grabImageH - grabOffsetY // bottom
    const dropLatLng = MapUtils.pixelToLatlng(this.props.googleMaps, event.clientX + offsetX, event.clientY + offsetY)

    const { selectedSubnetId, subnetFeatures, drafts } = this.props
    if (!isEquipmentInsideBoundary(dropLatLng, selectedSubnetId, subnetFeatures, drafts)) return false

    if (entityBeingDropped === constants.DRAG_DROP_NETWORK_EQUIPMENT) {
      // A network equipment item was dropped. Handle it.
      event.stopPropagation()
      event.preventDefault()
      const networkNodeType = event.dataTransfer.getData(constants.DRAG_DROP_ENTITY_DETAILS_KEY)

      let featureToCreate = {
        id: uuidStore.getUUID(),
        point: WktUtils.getWKTPointFromGoogleMapLatLng(dropLatLng),
      }

      if (networkNodeType === "undefined") {
        const featureCoordinates = featureToCreate.point.coordinates
        const polygonPath = [
          { lat: featureCoordinates[1], lng: featureCoordinates[0] - .001 },
          { lat: featureCoordinates[1], lng: featureCoordinates[0] + .001 },
          { lat: featureCoordinates[1] - .001, lng: featureCoordinates[0] + .001 },
          { lat: featureCoordinates[1] - .001, lng: featureCoordinates[0] - .001 }
        ]
        // Create a fake polygon to extract the geometry data
        const polygon = new google.maps.Polygon({
          paths: polygonPath,
        })

        const constructionType =
          this.props.planThumbInformation[featureToCreate.id]
            ? this.props.planThumbInformation[featureToCreate.id]
            : constants.BLOCKER.KEY;
        const isBlocker = constructionType === constants.BLOCKER.KEY
        featureToCreate = {
          ...featureToCreate,
          geometry: WktUtils.getWKTPolygonFromGoogleMapPath(polygon.getPath()),
          attributes: {},
          dataType: "edge_construction_area",
          costMultiplier: isBlocker
            ? constants.BLOCKER.COST_MULTIPLIER
            : constants.INCLUSION.COST_MULTIPLIER,
          dateModified: Date.now(),
          edgeFeatureReferences: [],
          exportedAttributes: {},
          objectId: featureToCreate.id,
          priority: isBlocker
            ? constants.BLOCKER.PRIORITY
            : constants.INCLUSION.PRIORITY,
        }

        delete featureToCreate.id;
        delete featureToCreate.point;

        this.props.createConstructionArea(featureToCreate);
      } else {
        featureToCreate.networkNodeType = networkNodeType
        this.props.createFeature(featureToCreate)
      }
    } else if (entityBeingDropped === constants.DRAG_IS_BOUNDARY) {
      const position = new google.maps.LatLng(dropLatLng.lat(), dropLatLng.lng())
      const radius = (40000 / Math.pow(2, this.props.googleMaps.getZoom())) * 2 * 256 // radius in meters
      const path = this.generateHexagonPath(position, radius)
      const feature = {
        objectId: uuidStore.getUUID(),
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[path]]
        },
        isExistingObject: false,
      }
      this.props.createMultiPolygon(feature)
    }
  }

  generateHexagonPath (position, radius) {
    const pathPoints = []
    for (let angle = -90; angle < 270; angle += 60) {
      const point = google.maps.geometry.spherical.computeOffset(position, radius, angle)
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
  googleMaps: state.map.googleMaps,
  planThumbInformation: state.planEditor.planThumbInformation,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  drafts: state.planEditor.drafts,
})

const mapDispatchToProps = dispatch => ({
  createFeature: (equipment) => dispatch(PlanEditorActions.createFeature(equipment)),
  createMultiPolygon: (feature) => dispatch(ViewSettingsActions.createMultiPolygon(feature)),
  createConstructionArea: (constructionArea) => dispatch(PlanEditorActions.createConstructionArea(constructionArea)),
})

const EquipmentDropTargetComponent = wrapComponentWithProvider(reduxStore, EquipmentDropTarget, mapStateToProps, mapDispatchToProps)
export default EquipmentDropTargetComponent
