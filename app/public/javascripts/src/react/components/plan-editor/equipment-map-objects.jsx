/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import WorkflowState from '../../../shared-utils/workflow-state'
import PlanEditorActions from './plan-editor-actions'
import SelectionActions from '../selection/selection-actions'
import WktUtils from '../../../shared-utils/wkt-utils'

const SELECTION_Z_INDEX = 1
const MAP_OBJECT_Z_INDEX = SELECTION_Z_INDEX + 1

export class EquipmentMapObjects extends Component {
  constructor (props) {
    super(props)
    this.objectIdToMapObject = {}
    this.objectIdToSelectionOverlay = {}
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
    idsToUpdate.forEach(objectId => this.updateMapObject(objectId))
    this.highlightSelectedMarkers()
  }

  createMapObject (objectId) {
    const equipment = this.props.transactionFeatures[objectId].feature
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = !((equipment.workflow_state_id & WorkflowState.LOCKED.id) ||
                          (equipment.workflow_state_id & WorkflowState.INVALIDATED.id))
    const mapObject = new google.maps.Marker({
      objectId: equipment.objectId, // Not used by Google Maps
      position: WktUtils.getGoogleMapLatLngFromWKTPoint(equipment.geometry),
      icon: {
        url: this.props.equipmentDefinitions[equipment.networkNodeType].iconUrl
      },
      draggable: isEditable, // Allow dragging only if feature is not locked
      clickable: isEditable,
      map: this.props.googleMaps,
      zIndex: MAP_OBJECT_Z_INDEX
    })
    // When the marker is dragged, modify its position in the redux store
    mapObject.addListener('dragend', event => {
      var newEquipment = JSON.parse(JSON.stringify(this.props.transactionFeatures[mapObject.objectId]))
      newEquipment.feature.geometry.coordinates = [event.latLng.lng(), event.latLng.lat()]
      this.props.modifyFeature(this.props.transactionId, newEquipment)
    })
    mapObject.addListener('rightclick', event => {
      const eventXY = WktUtils.getXYFromEvent(event)
      this.props.showContextMenuForEquipment(this.props.planId, this.props.transactionId, this.props.selectedBoundaryTypeId, mapObject.objectId, eventXY.x, eventXY.y)
    })
    mapObject.addListener('click', () => {
      this.props.selectEquipment(objectId)
      this.props.addSubnets([objectId])
      this.props.setSelectedSubnetId(objectId)
    })
    this.objectIdToMapObject[objectId] = mapObject
  }

  updateMapObject (objectId) {
    const geometry = this.props.transactionFeatures[objectId].feature.geometry
    this.objectIdToMapObject[objectId].setPosition(WktUtils.getGoogleMapLatLngFromWKTPoint(geometry))
  }

  deleteMapObject (objectId) {
    this.objectIdToMapObject[objectId].setMap(null)
    delete this.objectIdToMapObject[objectId]
    if (this.objectIdToSelectionOverlay[objectId]) {
      this.objectIdToSelectionOverlay[objectId].setMap(null)
      delete this.objectIdToSelectionOverlay[objectId]
    }
  }

  highlightSelectedMarkers () {
    Object.keys(this.objectIdToMapObject).forEach(objectId => {
      if (this.props.selectedFeatures.indexOf(objectId) >= 0) {
        // This marker is selected. Create a selection overlay if it does not exist.
        if (!this.objectIdToSelectionOverlay[objectId]) {
          this.objectIdToSelectionOverlay[objectId] = new google.maps.Marker({
            icon: {
              url: '/images/map_icons/aro/icon-selection-background.svg',
              size: new google.maps.Size(64, 64),
              scaledSize: new google.maps.Size(48, 48),
              anchor: new google.maps.Point(24, 48)
            },
            clickable: false,
            zIndex: SELECTION_Z_INDEX,
            opacity: 0.7
          })
          this.objectIdToSelectionOverlay[objectId].bindTo('position', this.objectIdToMapObject[objectId], 'position')
        }
        this.objectIdToSelectionOverlay[objectId].setMap(this.props.googleMaps)
      } else {
        // This marker is not selected. Turn off selection overlay if it exists
        this.objectIdToSelectionOverlay[objectId] && this.objectIdToSelectionOverlay[objectId].setMap(null)
      }
    })
  }

  componentWillUnmount () {
    Object.keys(this.objectIdToMapObject).forEach(objectId => this.deleteMapObject(objectId))
  }
}

EquipmentMapObjects.propTypes = {
  transactionId: PropTypes.number,
  transactionFeatures: PropTypes.object,
  equipmentDefinitions: PropTypes.object,
  selectedBoundaryTypeId: PropTypes.number,
  selectedFeatures: PropTypes.arrayOf(PropTypes.string),
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
  selectedBoundaryTypeId: state.mapLayers.selectedBoundaryType.id,
  selectedFeatures: state.selection.planEditorFeatures,
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  modifyFeature: (transactionId, equipment) => dispatch(PlanEditorActions.modifyFeature('equipment', transactionId, equipment)),
  showContextMenuForEquipment: (planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y))
  },
  selectEquipment: objectId => dispatch(SelectionActions.setPlanEditorFeatures([objectId])),
  addSubnets: subnetIds => dispatch(PlanEditorActions.addSubnets(subnetIds)),
  setSelectedSubnetId: subnetId => dispatch(PlanEditorActions.setSelectedSubnetId(subnetId)),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
