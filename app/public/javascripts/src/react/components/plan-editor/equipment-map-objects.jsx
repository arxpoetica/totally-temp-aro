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
    this.mapObjects = {}
    this.selectionOverlays = {}
    this.droplinks = {}
  }

  render() {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate() {
    // FIXME: how to cache this layer better so we don't have to delete every lifecycle
    Object.keys(this.mapObjects).forEach(id => this.deleteMapObject(id))

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
    
    const { objectId } = feature
    
    // ToDo: unhack this 
    //let isLocked = false
    //if (feature.networkNodeType === "central_office") isLocked = true

    const mapObject = new google.maps.Marker({
      objectId, // Not used by Google Maps
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
    mapObject.addListener('click', (event) => {
      this.props.selectEditFeatureById(objectId)
      // this.props.addSubnets([objectId])
      // this.props.setSelectedSubnetId(objectId)


      const selectionCircle = new google.maps.Circle({
        map: this.props.googleMaps,
        center: event.latLng,
        radius: 25,
        visible: false,
      });

      const selectedEquipment = Object.values(this.mapObjects)
        .filter((object) => selectionCircle.getBounds().contains(object.getPosition()))
        .map(filteredMapObjects => filteredMapObjects.objectId)

      selectionCircle.setMap(null)
      this.props.selectEditFeaturesById(selectedEquipment)
    })

    this.mapObjects[objectId] = mapObject
  }

  deleteMapObject(id) {
    this.mapObjects[id].setMap(null)
    delete this.mapObjects[id]
    if (this.selectionOverlays[id]) {
      this.selectionOverlays[id].setMap(null)
      delete this.selectionOverlays[id]
    }
  }

  deleteDroplinks() {
    Object.values(this.droplinks).forEach(polyline => polyline.setMap(null))
    this.droplinks = {}
  }

  highlightSelectedMarkers() {
    Object.keys(this.mapObjects).forEach(id => {
      if (this.props.selectedEditFeatureIds.indexOf(id) >= 0) {
        const { subnetFeatures, selectedSubnetId, googleMaps, selectedLocations } = this.props

        // This marker is selected. Create a selection overlay if it does not exist.
        let icon = '/svg/map-icons/selection-1.svg'
        if (id === selectedSubnetId) {
          icon = '/svg/map-icons/selection-2.svg'
        }

        if (this.selectionOverlays[id]) {
          // TODO: just change the icon instead of deleteing and remaking
          this.selectionOverlays[id].setMap(null)
          delete this.selectionOverlays[id]
        }

        this.selectionOverlays[id] = new google.maps.Marker({
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
        this.selectionOverlays[id].bindTo('position', this.mapObjects[id], 'position')
        this.selectionOverlays[id].setMap(googleMaps)

        const { feature } = subnetFeatures[id]
        if (
          id === selectedSubnetId
          && feature.networkNodeType === 'fiber_distribution_terminal'
        ) {
          const [lng, lat] = feature.geometry.coordinates
          for (const [droplinkId, location] of Object.entries(selectedLocations)) {
            // oddly, sometimes `location` is `undefined`
            if (location) {
              const { latitude, longitude } = location.point
              // TODO: enhance when droplink lengths are exceeded???
              this.droplinks[droplinkId] = new google.maps.Polyline({
                path: [{ lat, lng }, { lat: latitude, lng: longitude }],
                strokeColor: '#84d496',
                strokeWeight: 1.5,
              })
              this.droplinks[droplinkId].setMap(googleMaps)
            }
          }
        }

      } else {
        // This marker is not selected. Turn off selection overlay if it exists
        this.selectionOverlays[id] && this.selectionOverlays[id].setMap(null)
      }
    })
  }

  componentWillUnmount() {
    this.deleteDroplinks()
    Object.keys(this.mapObjects).forEach(id => this.deleteMapObject(id))
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
  moveFeature: (id, coordinates) => dispatch(PlanEditorActions.moveFeature(id, coordinates)),
  showContextMenuForEquipment: (equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(equipmentObjectId, x, y))
  },
  selectEditFeatureById: id => dispatch(PlanEditorActions.selectEditFeaturesById([id])),
  // addSubnets: ids => dispatch(PlanEditorActions.addSubnets(ids)),
  setSelectedSubnetId: id => dispatch(PlanEditorActions.setSelectedSubnetId(id)),
  selectEditFeaturesById: featureIds => dispatch(PlanEditorActions.selectEditFeaturesById(featureIds)),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
