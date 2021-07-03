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
    /*
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
    */
    
    const createdIds = Object.keys(this.objectIdToMapObject)
    let idsToDelete = Object.keys(this.objectIdToMapObject)
    let featuresToCreate = []
    let idsToUpdate = []
    //let subnetFeaturesById = {}
    if (this.props.selectedSubnet) {
      this.props.selectedSubnet.children.forEach(feature => {
        const objectId = feature.id || feature.objectId
        //subnetFeaturesById[objectId] = feature
        var index = createdIds.indexOf(objectId)
        if (index >= 0) {
          // we already have this one
          idsToUpdate.push(objectId)
          idsToDelete.splice(index, 1)
        } else {
          featuresToCreate.push(feature)
        }
      })
    }
    idsToDelete.forEach(objectId => this.deleteMapObject(objectId))
    featuresToCreate.forEach(feature => this.createMapObject(feature))
    //idsToUpdate.forEach(objectId => this.updateMapObject(objectId))
    this.highlightSelectedMarkers()

  }

  createMapObject (feature) {
    //const feature = this.props.transactionFeatures[objectId].feature
    // The marker is editable if the state is not LOCKED or INVALIDATED
    //const isEditable = !((feature.workflow_state_id & WorkflowState.LOCKED.id) ||
    //                      (feature.workflow_state_id & WorkflowState.INVALIDATED.id))
    const isEditable = true
    let objectId = feature.objectId || feature.id
    const mapObject = new google.maps.Marker({
      objectId: objectId, // Not used by Google Maps
      // note: service needs to change 
      //  planEditor.subnets[###].children[#].point
      //  planEditor.subnets[###].children[#].geometry
      position: WktUtils.getGoogleMapLatLngFromWKTPoint(feature.geometry || feature.point), 
      icon: {
        url: this.props.equipmentDefinitions[feature.networkNodeType].iconUrl
      },
      draggable: isEditable, // Allow dragging only if feature is not locked
      clickable: isEditable,
      map: this.props.googleMaps,
      zIndex: MAP_OBJECT_Z_INDEX
    })
    // When the marker is dragged, modify its position in the redux store
    mapObject.addListener('dragend', event => {
      console.log([event.latLng.lng(), event.latLng.lat()])
      // I need to figure out where this goes
      //var newEquipment = JSON.parse(JSON.stringify(this.props.transactionFeatures[mapObject.objectId]))
      //newEquipment.feature.geometry.coordinates = [event.latLng.lng(), event.latLng.lat()]
      //this.props.modifyFeature(newEquipment)
    })
    mapObject.addListener('rightclick', event => {
      const eventXY = WktUtils.getXYFromEvent(event)
      this.props.showContextMenuForEquipment(mapObject.objectId, eventXY.x, eventXY.y)
    })
    mapObject.addListener('click', () => {
      this.props.selectFeatureById(objectId)
      //this.props.addSubnets([objectId])
      //this.props.setSelectedSubnetId(objectId)
    })
    this.objectIdToMapObject[objectId] = mapObject
  }

  updateMapObject (objectId) {
    // will we ever get position changes from elsewhere? 
    //const geometry = this.props.transactionFeatures[objectId].feature.geometry
    //this.objectIdToMapObject[objectId].setPosition(WktUtils.getGoogleMapLatLngFromWKTPoint(geometry))
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
    // ToDo: this function shouldn't be aware of props, 
    //  it should just accept an array of objectIds 
    Object.keys(this.objectIdToMapObject).forEach(objectId => {
      if (this.props.selectedFeatureIds.indexOf(objectId) >= 0) {
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
/*
EquipmentMapObjects.propTypes = {
  transactionId: PropTypes.number,
  transactionFeatures: PropTypes.object,
  equipmentDefinitions: PropTypes.object,
  selectedBoundaryTypeId: PropTypes.number,
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string),
  googleMaps: PropTypes.object
}
*/
const mapStateToProps = state => ({
  //planId: state.plan.activePlan.id,
  //transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
  //selectedBoundaryTypeId: state.mapLayers.selectedBoundaryType.id,
  //selectedFeatureIds: state.selection.planEditorFeatures,
  selectedFeatureIds: state.planEditor.selectedFeatureIds,
  googleMaps: state.map.googleMaps,
  selectedSubnet: state.planEditor.subnets[state.planEditor.selectedSubnetId],
})

const mapDispatchToProps = dispatch => ({
  modifyFeature: (feature) => dispatch(PlanEditorActions.modifyFeature('equipment', feature)),
  showContextMenuForEquipment: (equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(equipmentObjectId, x, y))
  },
  //selectFeatureById: objectId => dispatch(SelectionActions.setPlanEditorFeatures([objectId])),
  selectFeatureById: objectId => dispatch(PlanEditorActions.selectFeaturesById([objectId])),
  addSubnets: subnetIds => dispatch(PlanEditorActions.addSubnets(subnetIds)),
  setSelectedSubnetId: subnetId => dispatch(PlanEditorActions.setSelectedSubnetId(subnetId)),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
