import { Component } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import PlanEditorSelectors from './plan-editor-selectors.js'
import { constants } from './constants'

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
    this.deleteDroplinks()

    const { subnetFeatures, featuresRenderInfo } = this.props

    // delete any not present
    for (const id of Object.keys(this.mapObjects)) {
      const info = featuresRenderInfo.find(feature => feature.id === id)
      if (info) {
        const feature = subnetFeatures[info.id] && subnetFeatures[info.id].feature
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
      if (mapObject) {
        mapObject.setOpacity(idle ? 0.4 : 1.0)
      } else {
        const feature = subnetFeatures[id] && subnetFeatures[id].feature
        if (feature) {
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
    }

    this.highlightSelectedMarkers()
  }

  createMapObject(feature, idle) {
    const { objectId } = feature

    const mapObject = new google.maps.Marker({
      objectId, // Not used by Google Maps
      position: WktUtils.getGoogleMapLatLngFromWKTPoint(feature.geometry), 
      icon: {
        url: this.props.equipmentDefinitions[feature.networkNodeType].iconUrl
      },
      draggable: !feature.locked, // Allow dragging only if feature is not locked
      opacity: idle ? 0.4 : 1.0,
      map: this.props.googleMaps,
      zIndex: constants.Z_INDEX_MAP_OBJECT,
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
      // NOTE: this is a workaround to make sure we're selecting
      // equipment that might be piled on top of one another
      const selectionCircle = new google.maps.Circle({
        map: this.props.googleMaps,
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
      this.props.selectEditFeaturesById(selectedEquipmentIds)
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
          // re-render the main selection so it appears on top
          this.deleteMapObject(id)
          this.createMapObject(subnetFeatures[id].feature, false)
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
  featuresRenderInfo: PlanEditorSelectors.getFeaturesRenderInfo(state),
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  selectedLocations: PlanEditorSelectors.getSelectedSubnetLocations(state),
})

const mapDispatchToProps = dispatch => ({
  moveFeature: (id, coordinates) => dispatch(PlanEditorActions.moveFeature(id, coordinates)),
  showContextMenuForEquipment: (equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipment(equipmentObjectId, x, y))
  },
  setSelectedSubnetId: id => dispatch(PlanEditorActions.setSelectedSubnetId(id)),
  selectEditFeaturesById: featureIds => dispatch(PlanEditorActions.selectEditFeaturesById(featureIds)),
})

const EquipmentMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentMapObjects)
export default EquipmentMapObjectsComponent
