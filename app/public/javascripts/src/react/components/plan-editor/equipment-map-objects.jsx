import { Component } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import PlanEditorSelectors from './plan-editor-selectors'
import { constants, getIconUrl } from './shared'

export class EquipmentMapObjects extends Component {
  constructor(props) {
    super(props)
    this.mapObjects = {}
    this.selectionOverlays = {}
    this.droplinks = {}
  }

  // No UI for this component. It deals with map objects only.
  render() { return null }
  componentDidMount() { this.renderObjects() }
  componentDidUpdate() { this.renderObjects() }

  renderObjects() {
    // ToDo: this runs every time cursorLocations changes FIX
    this.deleteDroplinks() // this should be selective not wholesale rerender

    const { subnetFeatures, featuresRenderInfo } = this.props

    // delete any not present
    for (const id of Object.keys(this.mapObjects)) {
      const info = featuresRenderInfo.find(feature => feature.id === id)
      if (info) {
        const feature = subnetFeatures[info.id] && subnetFeatures[info.id].feature
        // delete mapObject if feature no longer exists
        if (!feature) this.deleteMapObject(id)
        // only delete idle terminals when found
        if (feature && info.idle && feature.networkNodeType.includes('terminal')) {
          this.deleteMapObject(id)
        }
      } else {
        // if not found, just delete straight across
        this.deleteMapObject(id)
      }
    }

    // either add or update existing features
    for (const { id, idle } of featuresRenderInfo) {
      const mapObject = this.mapObjects[id]
      const feature = subnetFeatures[id] && subnetFeatures[id].feature
      if (mapObject) {
        // TODO: can we check somehow if this has actually changed and then update it?
        mapObject.setOpacity(idle ? 0.4 : 1.0)
        mapObject.setIcon(getIconUrl(feature, this.props))
      } else if (feature) {
        if (idle) {
          // if idle show everything but the terminals for performance reasons
          if (!feature.networkNodeType.includes('terminal')) {
            this.createMapObject(feature, idle)
          }
        } else {
          // if selected (not idle) just show everything in the subnet
          this.createMapObject(feature, idle)
        }
      }
    }

    this.highlightSelectedMarkers()
  }

  createMapObject(feature, idle) {

    const {
      googleMaps,
      moveFeature,
      showContextMenuForEquipment,
      selectEditFeaturesById,
      addCursorEquipmentIds,
      clearCursorEquipmentIds,
    } = this.props

    const { objectId } = feature

    const mapObject = new google.maps.Marker({
      objectId, // Not used by Google Maps
      mouseoverTimer: null,
      position: WktUtils.getGoogleMapLatLngFromWKTPoint(feature.geometry), 
      icon: { url: getIconUrl(feature, this.props) },
      draggable: !feature.locked, // Allow dragging only if feature is not locked
      opacity: idle ? 0.4 : 1.0,
      map: googleMaps,
      zIndex: constants.Z_INDEX_MAP_OBJECT,
    })

    mapObject.addListener('dragend', event => {
      let coordinates = [event.latLng.lng(), event.latLng.lat()]
      moveFeature(mapObject.objectId, coordinates)
    })
    mapObject.addListener('contextmenu', event => {
      const eventXY = WktUtils.getXYFromEvent(event)
      showContextMenuForEquipment(mapObject.objectId, eventXY.x, eventXY.y)
    })
    mapObject.addListener('click', event => {
      // NOTE: this is a workaround to make sure we're selecting
      // equipment that might be piled on top of one another
      const selectionCircle = new google.maps.Circle({
        map: googleMaps,
        center: event.latLng,
        // FIXME: this radius is only useful at certain zoom levels.
        // How can we set this correctly based on zoom?
        radius: 25,
        visible: false,
      })

      const selectedEquipmentIds = Object.values(this.mapObjects)
        .filter(object => selectionCircle.getBounds().contains(object.getPosition()))
        .map(filteredMapObjects => filteredMapObjects.objectId)

      selectionCircle.setMap(null)
      selectEditFeaturesById(selectedEquipmentIds)
    })

    mapObject.addListener('mouseover', () => {
      clearTimeout(mapObject.mouseoverTimer)
      mapObject.mouseoverTimer = setTimeout(() => {
        addCursorEquipmentIds([mapObject.objectId])
      }, 350)
    })
    mapObject.addListener('mouseout', () => {
      clearTimeout(mapObject.mouseoverTimer)
      clearCursorEquipmentIds()
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

  highlightSelectedMarkers() {
    Object.keys(this.mapObjects).forEach(id => {
      if (this.props.selectedEditFeatureIds.indexOf(id) >= 0) {
        const { subnetFeatures, selectedSubnetId, googleMaps, selectedLocations } = this.props

        // This marker is selected. Create a selection overlay if it does not exist.
        let icon = '/svg/map-icons/selection-1.svg'
        if (id === selectedSubnetId) {
          icon = '/svg/map-icons/selection-2.svg'
          // re-render the main selection so it appears on top if there are multiple equipments
          if (this.props.selectedEditFeatureIds.length > 1){
            this.deleteMapObject(id)
            this.createMapObject(subnetFeatures[id].feature, false)
          }
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
          zIndex: constants.Z_INDEX_SELECTION,
          opacity: 0.7,
        })
        this.selectionOverlays[id].bindTo('position', this.mapObjects[id], 'position')
        this.selectionOverlays[id].setMap(googleMaps)

        if (subnetFeatures[id]){
          const { feature } = subnetFeatures[id]
          console.log(feature)
          if (
            id === selectedSubnetId
            //&& feature.networkNodeType === 'fiber_distribution_terminal'
            && 'dropLinks' in feature
            && feature.dropLinks.length > 0
          ) {
            const [lng, lat] = feature.geometry.coordinates
            for (const [droplinkId, location] of Object.entries(selectedLocations)) {
              this.makeDropLink(location, {lng, lat}, droplinkId)
            }
          }
        }
      } else {
        // This marker is not selected. Turn off selection overlay if it exists
        this.selectionOverlays[id] && this.selectionOverlays[id].setMap(null)
      }
    })
    // location hover links
    for (const [droplinkId, location] of Object.entries(this.props.cursorLocations)) {
      // oddly, sometimes `location` is `undefined`
      if (location && location.parentEquipmentId) {
        console.log(location)
        const [lng, lat] = this.props.subnetFeatures[location.parentEquipmentId].feature.geometry.coordinates
        this.makeDropLink(location, {lng, lat}, droplinkId)
      }
    }
  }

  makeDropLink(location, parentPt, droplinkId) {
    if (!droplinkId) droplinkId = location.objectIds[0] 
    if (droplinkId && parentPt && location && location.parentEquipmentId) {
      const { latitude, longitude } = location.point
      if (this.droplinks[droplinkId]) this.deleteDropLink(droplinkId)
      
      this.droplinks[droplinkId] = new google.maps.Polyline({
        path: [parentPt, { lat: latitude, lng: longitude }],
        strokeColor: '#84d496',
        strokeWeight: 1.5,
      })
      this.droplinks[droplinkId].setMap(this.props.googleMaps)
    }
  }

  deleteDropLink(droplinkId) {
    if (this.droplinks[droplinkId]) {
      this.droplinks[droplinkId].setMap(null)
      delete this.droplinks[droplinkId]
    }
  }
  
  deleteDroplinks() {
    Object.values(this.droplinks).forEach(polyline => polyline.setMap(null))
    this.droplinks = {}
  }

  componentWillUnmount() {
    this.deleteDroplinks()
    Object.keys(this.mapObjects).forEach(id => this.deleteMapObject(id))
  }
}

const mapStateToProps = state => ({
  ARO_CLIENT: state.configuration.system.ARO_CLIENT,
  equipments: state.mapLayers.networkEquipment.equipments,
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  googleMaps: state.map.googleMaps,
  featuresRenderInfo: PlanEditorSelectors.getFeaturesRenderInfo(state),
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  selectedLocations: PlanEditorSelectors.getSelectedSubnetLocations(state),
  cursorLocations: PlanEditorSelectors.getCursorLocations(state),
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
})

const mapDispatchToProps = dispatch => ({
  moveFeature: (id, coordinates) => dispatch(PlanEditorActions.moveFeature(id, coordinates)),
  showContextMenuForEquipment: (equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(equipmentObjectId, x, y))
  },
  setSelectedSubnetId: id => dispatch(PlanEditorActions.setSelectedSubnetId(id)),
  selectEditFeaturesById: featureIds => dispatch(PlanEditorActions.selectEditFeaturesById(featureIds)),
  addCursorEquipmentIds: ids => dispatch(PlanEditorActions.addCursorEquipmentIds(ids)),
  clearCursorEquipmentIds: () => dispatch(PlanEditorActions.clearCursorEquipmentIds()),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
