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
  constructor(props) {
    super(props)
    this.objectIdToMapObject = {}
    this.objectIdToSelectionOverlay = {}
    this.objectIdToDroplink = {}
  }

  render() {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate() {
    // FIXME: how to cache this layer better so we don't have to delete every lifecycle
    Object.keys(this.objectIdToMapObject).forEach(id => this.deleteMapObject(id))

    const idleFeaturesToCreate = []
    const featuresToCreate = []

    const { selectedIds, idleFeatureIds } = this.props

    for (const objectId of idleFeatureIds) {
      if (this.props.subnetFeatures[objectId]) {
        idleFeaturesToCreate.push(this.props.subnetFeatures[objectId].feature)
      }
    }

    for (const objectId of selectedIds) {
      if (this.props.subnetFeatures[objectId]) {
        featuresToCreate.push(this.props.subnetFeatures[objectId].feature)
      }
    }

    this.deleteDroplinks()
    idleFeaturesToCreate.forEach(feature => this.createMapObject(feature, true))
    featuresToCreate.forEach(feature => this.createMapObject(feature))
    this.highlightSelectedMarkers()
  }

  createMapObject(feature, idle) {
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
      draggable: !feature.locked, // Allow dragging only if feature is not locked
      clickable: !idle,
      opacity: idle ? 0.4 : 1.0,
      map: this.props.googleMaps,
      zIndex: MAP_OBJECT_Z_INDEX
    })

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
      // this.props.addSubnets([objectId])
      // this.props.setSelectedSubnetId(objectId)
    })

    this.objectIdToMapObject[objectId] = mapObject
  }

  deleteMapObject(objectId) {
    this.objectIdToMapObject[objectId].setMap(null)
    delete this.objectIdToMapObject[objectId]
    if (this.objectIdToSelectionOverlay[objectId]) {
      this.objectIdToSelectionOverlay[objectId].setMap(null)
      delete this.objectIdToSelectionOverlay[objectId]
    }
  }

  deleteDroplinks() {
    Object.values(this.objectIdToDroplink).forEach(polyline => polyline.setMap(null))
    this.objectIdToDroplink = {}
  }

  highlightSelectedMarkers() {
    Object.keys(this.objectIdToMapObject).forEach(objectId => {
      if (this.props.selectedEditFeatureIds.indexOf(objectId) >= 0) {
        const { subnetFeatures, selectedSubnetId, googleMaps, selectedLocations } = this.props

        // This marker is selected. Create a selection overlay if it does not exist.
        let icon = '/svg/map-icons/selection-1.svg'
        if (objectId === selectedSubnetId) {
          icon = '/svg/map-icons/selection-2.svg'
        }

        if (this.objectIdToSelectionOverlay[objectId]) {
          // TODO: just change the icon instead of deleteing and remaking
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
          opacity: 0.7,
        })
        this.objectIdToSelectionOverlay[objectId].bindTo('position', this.objectIdToMapObject[objectId], 'position')
        this.objectIdToSelectionOverlay[objectId].setMap(googleMaps)

        const { feature } = subnetFeatures[objectId]
        if (
          objectId === selectedSubnetId
          && feature.networkNodeType === 'fiber_distribution_terminal'
        ) {
          const [lng, lat] = feature.geometry.coordinates
          for (const [id, location] of Object.entries(selectedLocations)) {
            // oddly, sometimes `location` is `undefined`
            if (location) {
              const { latitude, longitude } = location.point
              // TODO: enhance when droplink lengths are exceeded???
              this.objectIdToDroplink[id] = new google.maps.Polyline({
                path: [{ lat, lng }, { lat: latitude, lng: longitude }],
                strokeColor: '#84d496',
                strokeWeight: 1.5,
              })
              this.objectIdToDroplink[id].setMap(googleMaps)
            }
          }
        }

      } else {
        // This marker is not selected. Turn off selection overlay if it exists
        this.objectIdToSelectionOverlay[objectId] && this.objectIdToSelectionOverlay[objectId].setMap(null)
      }
    })
  }

  componentWillUnmount() {
    this.deleteDroplinks()
    Object.keys(this.objectIdToMapObject).forEach(id => this.deleteMapObject(id))
  }
}

const mapStateToProps = state => ({
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  googleMaps: state.map.googleMaps,
  idleFeatureIds: PlanEditorSelectors.getIdleFeaturesIds(state),
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  selectedIds: PlanEditorSelectors.getSelectedIds(state),
  selectedLocations: PlanEditorSelectors.getSelectedSubnetLocations(state),
})

const mapDispatchToProps = dispatch => ({
  //modifyFeature: (feature) => dispatch(PlanEditorActions.modifyFeature('equipment', feature)),
  moveFeature: (featureId, coordinates) => dispatch(PlanEditorActions.moveFeature(featureId, coordinates)),
  showContextMenuForEquipment: (equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(equipmentObjectId, x, y))
  },
  selectEditFeatureById: objectId => dispatch(PlanEditorActions.selectEditFeaturesById([objectId])),
  // addSubnets: subnetIds => dispatch(PlanEditorActions.addSubnets(subnetIds)),
  setSelectedSubnetId: subnetId => dispatch(PlanEditorActions.setSelectedSubnetId(subnetId)),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
