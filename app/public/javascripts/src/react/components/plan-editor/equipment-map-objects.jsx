/* globals google */
import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import WorkflowState from '../../../shared-utils/workflow-state'
import PlanEditorActions from './plan-editor-actions'
import ContextMenuActions from '../context-menu/actions'
import MenuItemFeature from '../context-menu/menu-item-feature'
import MenuItemAction from '../context-menu/menu-item-action'

export class EquipmentMapObjects extends Component {
  constructor (props) {
    super(props)
    this.objectIdToMapObject = {}
  }

  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate () {
    const createdIds = new Set(Object.keys(this.objectIdToMapObject))
    const allEquipmentIds = new Set(
      Object.keys(this.props.transactionFeatures)
        .filter(objectId => this.props.transactionFeatures[objectId].feature.dataType === 'equipment')
    )
    const idsToCreate = [...allEquipmentIds].filter(objectId => !createdIds.has(objectId))
    const idsToDelete = [...createdIds].filter(objectId => !allEquipmentIds.has(objectId))
    const idsToUpdate = [...allEquipmentIds].filter(objectId => createdIds.has(objectId))
    idsToCreate.forEach(objectId => this.createMapObject(objectId))
    idsToDelete.forEach(objectId => this.deleteMapObject(objectId))
    idsToUpdate.forEach(objectId => this.updateMapObjectPosition(objectId))
  }

  createMapObject (objectId) {
    const equipment = this.props.transactionFeatures[objectId].feature
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = !((equipment.workflow_state_id & WorkflowState.LOCKED.id) ||
                          (equipment.workflow_state_id & WorkflowState.INVALIDATED.id))
    const mapObject = new google.maps.Marker({
      objectId: equipment.objectId, // Not used by Google Maps
      position: new google.maps.LatLng(equipment.geometry.coordinates[1], equipment.geometry.coordinates[0]),
      icon: {
        url: this.props.equipmentDefinitions[equipment.networkNodeType].iconUrl
      },
      draggable: isEditable, // Allow dragging only if feature is not locked
      clickable: isEditable,
      map: this.props.googleMaps
    })
    // When the marker is dragged, modify its position in the redux store
    mapObject.addListener('dragend', event => {
      var newEquipment = JSON.parse(JSON.stringify(this.props.transactionFeatures[mapObject.objectId]))
      newEquipment.feature.geometry.coordinates = [event.latLng.lng(), event.latLng.lat()]
      this.props.modifyEquipment(this.props.transactionId, newEquipment)
    })
    mapObject.addListener('rightclick', event => {
      const menuItemAction = new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteEquipment', this.props.transactionId, mapObject.objectId)
      const menuItemFeature = new MenuItemFeature('EQUIPMENT', 'Equipment', [menuItemAction])
      this.props.setContextMenuItems([menuItemFeature])
      const eventXY = this.getXYFromEvent(event)
      this.props.showContextMenu(eventXY.x, eventXY.y)
    })
    this.objectIdToMapObject[objectId] = mapObject
  }

  updateMapObjectPosition (objectId) {
    const coordinates = this.props.transactionFeatures[objectId].feature.geometry.coordinates
    const position = new google.maps.LatLng(coordinates[1], coordinates[0])
    this.objectIdToMapObject[objectId].setPosition(position)
  }

  deleteMapObject (objectId) {
    this.objectIdToMapObject[objectId].setMap(null)
    delete this.objectIdToMapObject[objectId]
  }

  getXYFromEvent (event) {
    var mouseEvent = null
    Object.keys(event).forEach((eventKey) => {
      if (event[eventKey] instanceof MouseEvent) {
        mouseEvent = event[eventKey]
      }
    })
    return {
      x: mouseEvent.clientX,
      y: mouseEvent.clientY
    }
  }

  componentWillUnmount () {
    Object.keys(this.objectIdToMapObject).forEach(objectId => this.deleteMapObject(objectId))
  }
}

EquipmentMapObjects.propTypes = {
  transactionId: PropTypes.number,
  transactionFeatures: PropTypes.object,
  equipmentDefinitions: PropTypes.object,
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  modifyEquipment: (transactionId, equipment) => dispatch(PlanEditorActions.modifyEquipment(transactionId, equipment)),
  setContextMenuItems: menuItemFeatures => dispatch(ContextMenuActions.setContextMenuItems(menuItemFeatures)),
  showContextMenu: (x, y) => dispatch(ContextMenuActions.showContextMenu(x, y))
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
