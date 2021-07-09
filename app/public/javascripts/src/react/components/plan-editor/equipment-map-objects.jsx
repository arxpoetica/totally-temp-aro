/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import WorkflowState from '../../../shared-utils/workflow-state'
import PlanEditorActions from './plan-editor-actions'
import SelectionActions from '../selection/selection-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import PlanEditorSelectors from './plan-editor-selectors.js'

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
    //const createdIds = Object.keys(this.objectIdToMapObject)
    let idsToDelete = Object.keys(this.objectIdToMapObject)
    let featuresToCreate = []
    let idsToUpdate = []
    
    this.props.allFeatureIds.forEach(objectId => {
      var index = idsToDelete.indexOf(objectId)
      if (index >= 0) {
        // we already have this one
        idsToUpdate.push(objectId)
        idsToDelete.splice(index, 1)
      } else {
        if (this.props.subnetFeatures[objectId]) featuresToCreate.push(this.props.subnetFeatures[objectId].feature)
      }
    })
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
    
    let objectId = feature.objectId
    
    // ToDo: unhack this 
    //let isLocked = false
    //if (feature.networkNodeType === "central_office") isLocked = true

    const mapObject = new google.maps.Marker({
      objectId: objectId, // Not used by Google Maps
      position: WktUtils.getGoogleMapLatLngFromWKTPoint(feature.geometry), 
      icon: {
        url: this.props.equipmentDefinitions[feature.networkNodeType].iconUrl
      },
      draggable: !feature.isLocked, // Allow dragging only if feature is not locked
      clickable: true,
      map: this.props.googleMaps,
      zIndex: MAP_OBJECT_Z_INDEX
    })
    // When the marker is dragged, modify its position in the redux store
    mapObject.addListener('dragend', event => {
      let coordinates = [event.latLng.lng(), event.latLng.lat()]
      this.props.moveFeature(mapObject.objectId, coordinates)
    })
    mapObject.addListener('rightclick', event => {
      const eventXY = WktUtils.getXYFromEvent(event)
      this.props.showContextMenuForEquipment(mapObject.objectId, eventXY.x, eventXY.y)
    })
    mapObject.addListener('click', () => {
      this.props.selectEditFeatureById(objectId)
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
    Object.keys(this.objectIdToMapObject).forEach(objectId => {
      if (this.props.selectedEditFeatureIds.indexOf(objectId) >= 0) {
        // This marker is selected. Create a selection overlay if it does not exist.
        let icon = '/images/map_icons/aro/icon-selection-background.svg'
        if (objectId === this.props.selectedSubnetId) icon = '/images/map_icons/aro/icon-selection-background_B.svg'
        
        if (this.objectIdToSelectionOverlay[objectId]) {
          // ToDo: just change the icon instead of deleteing and remaking
          this.objectIdToSelectionOverlay[objectId].setMap(null)
          delete this.objectIdToSelectionOverlay[objectId]
        }
        
        this.objectIdToSelectionOverlay[objectId] = new google.maps.Marker({
          icon: {
            url: icon,
            size: new google.maps.Size(64, 64),
            scaledSize: new google.maps.Size(48, 48),
            anchor: new google.maps.Point(24, 48)
          },
          clickable: false,
          zIndex: SELECTION_Z_INDEX,
          opacity: 0.7
        })
        this.objectIdToSelectionOverlay[objectId].bindTo('position', this.objectIdToMapObject[objectId], 'position')
        
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

const mapStateToProps = state => ({
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  allFeatureIds: PlanEditorSelectors.getSelectedIds(state),
})

const mapDispatchToProps = dispatch => ({
  modifyFeature: (feature) => dispatch(PlanEditorActions.modifyFeature('equipment', feature)),
  moveFeature: (featureId, coordinates) => dispatch(PlanEditorActions.moveFeature(featureId, coordinates)),
  showContextMenuForEquipment: (equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(equipmentObjectId, x, y))
  },
  selectEditFeatureById: objectId => dispatch(PlanEditorActions.selectEditFeaturesById([objectId])),
  addSubnets: subnetIds => dispatch(PlanEditorActions.addSubnets(subnetIds)),
  setSelectedSubnetId: subnetId => dispatch(PlanEditorActions.setSelectedSubnetId(subnetId)),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
