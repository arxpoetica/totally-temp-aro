import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import Constants from './constants'
import MapUtils from '../../common/map-utils'
import uuidStore from '../../../shared-utils/uuid-store'
import PlanEditorActions from './plan-editor-actions'
import Utils from './utils'
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
    const entityBeingDropped = event.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_KEY)
    if (entityBeingDropped === Constants.DRAG_DROP_NETWORK_EQUIPMENT) {
      // A network equipment item was dropped. Handle it.
      event.stopPropagation()
      event.preventDefault()
      // Convert pixels to latlng
      const grabOffsetX = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_OFFSET_X)
      const grabOffsetY = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_OFFSET_Y)
      const grabImageW = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_ICON_W)
      const grabImageH = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_ICON_H)
      const offsetX = (grabImageW * 0.5) - grabOffsetX // center
      const offsetY = grabImageH - grabOffsetY // bottom
      const dropLatLng = MapUtils.pixelToLatlng(this.props.googleMaps, event.clientX + offsetX, event.clientY + offsetY)
      const networkNodeType = event.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY)

      const featureToCreate = {
        objectId: uuidStore.getUUID(),
        geometry: Utils.getGeometryFromGoogleMapLatLng(dropLatLng),
        networkNodeType: networkNodeType,
        dataType: 'equipment',
        target_type: 'sewer',
        attributes: {
          siteName: '',
          siteIdentifier: '',
          selectedEquipmentType: 'Generic ADSL'
        },
        networkNodeEquipment: {
          siteInfo: {
            siteClli: '',
            siteName: '',
            address: '',
            dpiEnvironment: '',
            hsiOfficeCode: '',
            hsiEnabled: true,
            t1: false,
            fiberAvailable: false,
            physicallyLinked: false
          },
          existingEquipment: [],
          plannedEquipment: [],
          notes: ''
        },
        deploymentType: 'PLANNED'
      }
      this.props.createFeature(this.props.transactionId, featureToCreate)
    }
  }
}

EquipmentDropTarget.propTypes = {
  transactionId: PropTypes.number,
  isDraggingFeatureForDrop: PropTypes.bool,
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  isDraggingFeatureForDrop: state.planEditor.isDraggingFeatureForDrop,
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  createFeature: (transactionId, equipment) => dispatch(PlanEditorActions.createFeature('equipment', transactionId, equipment))
})

const EquipmentDropTargetComponent = wrapComponentWithProvider(reduxStore, EquipmentDropTarget, mapStateToProps, mapDispatchToProps)
export default EquipmentDropTargetComponent
