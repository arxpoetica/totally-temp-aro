/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import SelectionActions from '../selection/selection-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import { constants } from './shared'

export class EquipmentBoundaryMapObjects extends Component {
  constructor (props) {
    super(props)
    this.mapObject = undefined;
    this.clickOutListener = undefined;
    this.deleteKeyListener = undefined;
    this.mapObjectOverlay = [];
    this.neighborObjectsById = {}
    this.polygonOptions = {
      strokeColor: '#1f7de6',
      // strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: '#1f7de6',
      fillOpacity: 0.05,
    }
    this.neighborPolygonOptions = {
      strokeColor: '#1f7de6',
      //strokeOpacity: 0.5,
      strokeWeight: 1.5,
      fillColor: '#1f7de6',
      fillOpacity: 0.02,
    }
    
    this.clearMapObjectOverlay = this.clearMapObjectOverlay.bind(this);
    this.contextMenuClick = this.contextMenuClick.bind(this);
  }

  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate (prevProps, prevState) {
    // any changes to state props should cause a rerender
    const { subnets, subnetFeatures, clickedLatLng } = this.props
    if (prevProps.clickedLatLng !== clickedLatLng) this.selectSubnet(clickedLatLng)
    
    let selectedSubnetId = this.props.selectedSubnetId
    let activeFeature = subnetFeatures[selectedSubnetId]
    if (!activeFeature) {
      this.clearAll()
    } else {
      // step up through the subnets until you get to a subnet with no parent (the CO)
      let rootSubnetId = selectedSubnetId
      let parentSubnetId = activeFeature.subnetId
      while (parentSubnetId) {
        rootSubnetId = parentSubnetId
        const features = subnetFeatures[rootSubnetId]
        parentSubnetId = features ? features.subnetId : null
      }
      const children = subnets[rootSubnetId] && subnets[rootSubnetId].children || []
      const newNeighborIds = children.concat([rootSubnetId])
      // may need to ensure newNeighborIds are all unique 
      const index = newNeighborIds.indexOf(selectedSubnetId)
      if (index >= 0) {
        // pull from array 
        newNeighborIds.splice(index, 1)
      } else {
        // selected feature is not a subnet so only show neighbors
        selectedSubnetId = null
      }

      if (selectedSubnetId !== prevProps.selectedSubnetId) {
        this.deleteMapObject()
        this.createMapObject(selectedSubnetId)
      }

      const idsToCreate = []
      let idsToDelete = Object.keys(this.neighborObjectsById)
      newNeighborIds.forEach(id => {
        let delIndex = idsToDelete.indexOf(id)
        if (delIndex >= 0) {
          // already exists, just don't delete it
          idsToDelete.splice(delIndex, 1)
        } else {
          // doesn't exist need to create it
          idsToCreate.push(id)
        }
      })

      this.deleteNeighbors(idsToDelete)
      this.createNeighbors(idsToCreate)
     }
  }

  selectSubnet ([lat, lng]) {
    const { setSelectedSubnetId, selectEditFeaturesById, subnets } = this.props
    const latLng = new google.maps.LatLng(lat, lng)

    // loops through mapobjects and checks if latLng is inside
    for (const mapObject of Object.values(this.neighborObjectsById)) {
      if (google.maps.geometry.poly.containsLocation(latLng, mapObject)
          && subnets[mapObject.subnetId].parentSubnetId){
        // if it is inside, set that subnet as selected
        setSelectedSubnetId(mapObject.subnetId)
        selectEditFeaturesById([mapObject.subnetId])

        break
      }
    }
  }

  createMapObject (selectedSubnetId) {
    // const equipmentBoundary = this.props.transactionFeatures[objectId].feature
    if (!this.props.subnets[selectedSubnetId]) return
    const geometry = this.props.subnets[selectedSubnetId].subnetBoundary.polygon
    let isEditable = !this.props.subnets[selectedSubnetId].subnetBoundary.locked
    isEditable = isEditable && selectedSubnetId === this.props.selectedSubnetId
    
    if (this.mapObject) this.deleteMapObject()

    this.mapObject = new google.maps.Polygon({
      subnetId: selectedSubnetId, // Not used by Google Maps
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry),
      clickable: false,
      draggable: false,
      editable: isEditable,
      map: this.props.googleMaps,
    })
    
    this.mapObject.setOptions(this.polygonOptions)
    this.setupListenersForMapObject(this.mapObject)
    /*
    this.mapObject.addListener('rightclick', event => {
      // console.log('yay, you right clicked!')
      // const eventXY = WktUtils.getXYFromEvent(event)
      // this.props.showContextMenuForEquipmentBoundary(this.props.transactionId, this.mapObject.objectId, eventXY.x, eventXY.y)
    })
    this.mapObject.addListener('click', () => {
      // console.log('yay! you clicked!')
      // this.props.selectBoundary(objectId)  
    })
    */
  }

  createNeighborMapObject (subnetId) {
    // TODO: DRY the two create functions a bit
    if (!this.props.subnets[subnetId]) return
    const { subnetBoundary } = this.props.subnets[subnetId]
    const geometry = subnetBoundary.polygon
    let isEditable = (!subnetBoundary.locked) && subnetId === this.props.selectedSubnetId

    if (this.neighborObjectsById[subnetId]) {
      this.deleteNeighbors([subnetId])
    }

    const neighborObject = new google.maps.Polygon({
      subnetId: subnetId, // Not used by Google Maps
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry),
      clickable: false,
      draggable: false,
      editable: isEditable,
      zIndex: !this.props.subnets[subnetId].parentSubnetId 
        ? constants.Z_INDEX_CO_SUBNET 
        : constants.Z_INDEX_HUB_SUBNET,
      map: this.props.googleMaps,
    })

    neighborObject.setOptions(this.neighborPolygonOptions)
    this.neighborObjectsById[subnetId] = neighborObject
  }

  deleteMapObject () {
    if (this.mapObject) {
      this.mapObject.setMap(null)
      delete this.mapObject
    }
  }

  deleteNeighbors (idsToDelete) {
    idsToDelete.forEach(id => {
      if (this.neighborObjectsById[id]) {
        this.neighborObjectsById[id].setMap(null)
        delete this.neighborObjectsById[id]
      }
    })
  }
  
  createNeighbors (idsToCreate) {
    idsToCreate.forEach(id => {
      this.createNeighborMapObject(id)
    })
  }

  updateBoundaryShapeFromStore (objectId) {
    // const geometry = this.props.transactionFeatures[objectId].feature.geometry
    // const mapObject = this.mapObjects[objectId]
    // mapObject.setPath(WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry))
    // this.setupListenersForMapObject(mapObject)
  }

  modifyBoundaryShape (mapObject) {
    let geometry = WktUtils.getWKTMultiPolygonFromGoogleMapPaths(mapObject.getPaths())
    this.props.boundaryChange(mapObject.subnetId, geometry)
  }

  setupListenersForMapObject (mapObject) {
    const self = this // to keep reference 
    // TODO: check to make sure all boundaries are legit and concave/non-crossing
    mapObject.getPaths().forEach(function (path, index) {
      google.maps.event.addListener(path, 'insert_at', function () {
        self.modifyBoundaryShape(mapObject)
      })
      google.maps.event.addListener(path, 'remove_at', function () {
        self.modifyBoundaryShape(mapObject)
      })
      // FIXME: make deleting vertices work
      // ToDo: avoid redundant first=last polygons
      //  clear these when parsing from service 
      //  and if needed, replace them when unparsing to send back to service
      google.maps.event.addListener(path, 'set_at', function () {
        if (!WktUtils.isClosedPath(path)) {
          // IMPORTANT to check if it is already a closed path, otherwise we will get into an infinite loop when trying to keep it closed
          if (index === 0) {
            // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
            path.setAt(0, path.getAt(path.length - 1))
            self.modifyBoundaryShape(mapObject)
          } else if (index === path.length - 1) {
            // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
            path.setAt(path.length - 1, path.getAt(0))
            self.modifyBoundaryShape(mapObject)
          }
        } else {
          self.modifyBoundaryShape(mapObject)
        }
      })
    })

    mapObject.addListener('contextmenu', event => {
      this.contextMenuClick(event);
    })
    
    mapObject.addListener('click', event => {
      if (event.vertex) {
        event.domEvent.stopPropagation();
        if (event.domEvent.shiftKey) {
          const indexOfMarker = this.mapObjectOverlay.findIndex((marker) => {
            return marker.title === `${event.vertex}`
          });
          if (indexOfMarker > -1) {
            // If you select a vertex that is already selected, it will remove it.
            this.removeMarker(indexOfMarker);
          } else {
            this.addMarkerOverlay(event);
          }
        }
      } else {
        // This is set up to deselect all vertices if the click is inside the polygon
        // but not on a vertex
        this.clearMapObjectOverlay();
      }
    })

    this.clickOutListener = this.props.googleMaps.addListener('click', event => {
      if (!google.maps.geometry.poly.containsLocation(event.latLng, mapObject) && this.mapObjectOverlay.length > 0) {
        // Any click that is outside of the polygon will deselect all vertices
        this.clearMapObjectOverlay();
      }
    })
    
    this.deleteKeyListener = google.maps.event.addDomListener(document, 'keydown', (e) => {
      const code = (e.keyCode ? e.keyCode : e.which);
      // 8 = Backspace
      // 46 = Delete
      // Supporting both of these because not all keyboards have a "delete" key
      if ((code === 8 || code === 46) && this.mapObjectOverlay.length > 0) {
        this.props.deleteBoundaryVertices(mapObject, this.mapObjectOverlay, this.clearMapObjectOverlay)
      }
    });
  }
  
  clearAll () {
    // Clear all markers from map when clearing poly
    this.clearMapObjectOverlay()
    this.deleteMapObject()
    // delete all neighbors
    this.deleteNeighbors(Object.keys(this.neighborObjectsById))
    // Remove global listeners on tear down
    google.maps.event.removeListener(this.clickOutListener);
    google.maps.event.removeListener(this.deleteKeyListener);
  }

  addMarkerOverlay(event) {
    const vertex = this.mapObject.getPath().getAt(event.vertex);
    // Position of the marker is oriented on the vertex rather than the event.latLng to ensure
    // the coords are normalized
    const position = new google.maps.LatLng(vertex.lat(), vertex.lng())
    const newMarker = new google.maps.Marker({
      position,
      map: this.props.googleMaps,
      title: `${event.vertex}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        fillColor: "white",
        strokeColor: "#FF69B4",
        strokeOpacity: 1,
        strokeWeight: 3,
        scale: 6,
        // This was added to ensure that the svg was centered on the verte
        // The vertex coords seem to be .1,.1 off center of the vertex icon itself.
        anchor: new google.maps.Point(.1, .1)
      }
    })

    newMarker.addListener("click", () => {
      // Added this because once the marker is added sometimes you click the marker and sometimes the vertex
      // So this is a fail safe.
      if (event.domEvent.shiftKey) {
        const indexOfMarker = this.mapObjectOverlay.findIndex((marker) => {
          return marker.title === marker.title;
        });
        this.removeMarker(indexOfMarker);
      }
    })

    newMarker.addListener('contextmenu', event => {
      this.contextMenuClick(event);
    })

    this.mapObjectOverlay = this.mapObjectOverlay.concat(newMarker);
  }

  removeMarker(indexOfMarker) {
      const mapObjectOverlayClone = [...this.mapObjectOverlay]
      const [removedMarker] = mapObjectOverlayClone.splice(indexOfMarker, 1)
      this.mapObjectOverlay = mapObjectOverlayClone;
      removedMarker.setMap(null);
  }

  contextMenuClick(event) {
    let vertexPayload;
    if(this.mapObjectOverlay.length > 0) {
      const indexOfMarker = this.mapObjectOverlay.findIndex((marker) => {
        return marker.title === `${event.vertex}`
      });
      
      if (event.vertex && indexOfMarker === -1) {
        // Add vertex to array if it doesn't already exist there.
        this.addMarkerOverlay(event);
      }
      vertexPayload = this.mapObjectOverlay;
    } else {
      vertexPayload = event.vertex;
    }
    const eventXY = WktUtils.getXYFromEvent(event)
    this.props.showContextMenuForEquipmentBoundary(this.mapObject, eventXY.x, eventXY.y, vertexPayload, this.clearMapObjectOverlay)
  }

  clearMapObjectOverlay() {
    for (const marker of this.mapObjectOverlay) {
      marker.setMap(null);
    }

    this.mapObjectOverlay = [];
  }

  componentWillUnmount () {
    this.clearAll()
  }
}

/* 
EquipmentBoundaryMapObjects.propTypes = {
  transactionId: PropTypes.number,
  transactionFeatures: PropTypes.object,
  googleMaps: PropTypes.object,
  subnets: PropTypes.object,
  selectedSubnetId: PropTypes.string,
}
*/

const mapStateToProps = state => ({
  //planId: state.plan.activePlan.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  //selectedBoundaryTypeId: state.mapLayers.selectedBoundaryType.id,
  //selectedFeatures: state.selection.planEditorFeatures,
  googleMaps: state.map.googleMaps,
  subnets: state.planEditor.subnets,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  clickedLatLng: state.planEditor.clickedLatLng,
})

const mapDispatchToProps = dispatch => ({
  modifyFeature: (equipmentBoundary) => dispatch(PlanEditorActions.modifyFeature('equipment_boundary', equipmentBoundary)),
  showContextMenuForEquipmentBoundary: (mapObject, x, y, vertex, callBack) => {
    dispatch(PlanEditorActions.showContextMenuForEquipmentBoundary(mapObject, x, y, vertex, callBack))
  },
  boundaryChange: (subnetId, geometry) => dispatch(PlanEditorActions.boundaryChange(subnetId, geometry)),
  deleteBoundaryVertices: (mapObjects, vertices, callBack) => dispatch(PlanEditorActions.deleteBoundaryVertices(mapObjects, vertices, callBack)),
  selectBoundary: objectId => dispatch(SelectionActions.setPlanEditorFeatures([objectId])),
  setSelectedSubnetId: subnetId => dispatch(PlanEditorActions.setSelectedSubnetId(subnetId)),
  selectEditFeaturesById: subnetIds => dispatch(PlanEditorActions.selectEditFeaturesById(subnetIds)),
})

const EquipmentBoundaryMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentBoundaryMapObjects)
export default EquipmentBoundaryMapObjectsComponent
