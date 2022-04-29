/* globals google */
import { Component } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import { MultiSelectVertices } from '../common/maps/multiselect-vertices'
import { InvalidBoundaryHandling } from '../common/maps/invalid-boundary-handling'
export class EquipmentBoundaryMapObjects extends Component {
  constructor (props) {
    super(props)
    this.mapObject = undefined
    this.clickOutListener = undefined
    this.deleteKeyListener = undefined
    this.mapObjectOverlay = []
    this.multiSelectVertices = undefined
    this.clearMapObjectOverlay = null
    this.invalidBoundaryHandling = new InvalidBoundaryHandling()
    this.contextMenuClick = this.contextMenuClick.bind(this)
  }

  // no ui for this component. it deals with map objects only.
  render () { return null }

  componentDidUpdate (prevProps, prevState) {
    // any changes to state props should cause a rerender
    const { subnets, subnetFeatures, planType } = this.props

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

      let allIds = []
      // Enable click anywhere subnet for Route Adjusters
      if (activeFeature.feature.dataType === 'edge_construction_area') {
        let rootSubnet
        for (let subnetFeature of Object.values(subnetFeatures)) {
          if (
            (subnetFeature.feature.networkNodeType === 'central_office' && planType !== 'RING')
            || (subnetFeature.feature.networkNodeType === 'subnet_node' && planType === 'RING')
          ) {
            rootSubnet = subnetFeature
            break
          }
        }
        rootSubnetId = rootSubnet.feature.objectId
        allIds.push(selectedSubnetId)
      }

      const childrenIds = subnets[rootSubnetId] && subnets[rootSubnetId].children || []
      const coEquipmentIds = subnets[rootSubnetId] && subnets[rootSubnetId].coEquipments || []
      const inclusiveIds = allIds.concat([...childrenIds, ...coEquipmentIds])
      // ensure allIds are unique
      const uniqueAllIds = [...new Set(inclusiveIds.concat([rootSubnetId]))]
      // selected feature is not a subnet
      if (!uniqueAllIds.includes(selectedSubnetId)) {
        selectedSubnetId = null
      }

      if (selectedSubnetId !== prevProps.selectedSubnetId) {
        this.deleteMapObject()
        this.createMapObject(selectedSubnetId)
      }

      if (this.mapObject && this.mapObject.dataType && this.mapObject.dataType === 'edge_construction_area') {
        this.deleteMapObject()
        this.createMapObject(selectedSubnetId)
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
      dataType: this.props.subnets[selectedSubnetId].dataType,
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry),
      clickable: false,
      draggable: false,
      editable: isEditable,
      map: this.props.googleMaps,
      strokeColor: '#1f7de6',
      strokeWeight: 3,
      fillColor: '#1f7de6',
      fillOpacity: 0.05,
    })
    this.setupListenersForMapObject(this.mapObject)
    this.multiSelectVertices = new MultiSelectVertices(
      this.mapObject,
      this.props.googleMaps,
      google,
      this.contextMenuClick
    )
    this.invalidBoundaryHandling.stashMapObject(this.mapObject.subnetId, this.mapObject)
    this.clearMapObjectOverlay = this.multiSelectVertices.clearMapObjectOverlay.bind(this.multiSelectVertices)
  }

  deleteMapObject () {
    if (this.mapObject) {
      this.mapObject.setMap(null)
      delete this.mapObject
    }
  }

  modifyBoundaryShape (mapObject) {
    const [isValidPolygon, validMapObject] = this.invalidBoundaryHandling.isValidPolygon(
      mapObject.objectId,
      mapObject
    )
      
    if (isValidPolygon) {
      this.invalidBoundaryHandling.stashMapObject(
        validMapObject.objectId,
        validMapObject
      )
      const geometry = WktUtils.getWKTMultiPolygonFromGoogleMapPaths(validMapObject.getPaths())
      this.props.boundaryChange(validMapObject.subnetId, geometry)
    } else {
      this.createMapObject(validMapObject.subnetId)
    }
  }

  setupListenersForMapObject (mapObject) {
    mapObject.getPaths().forEach((path, index) => {
      google.maps.event.addListener(path, 'insert_at', () => this.modifyBoundaryShape(mapObject))
      google.maps.event.addListener(path, 'remove_at', () => this.modifyBoundaryShape(mapObject))
      // TODO: avoid redundant first = last polygons
      //  clear these when parsing from service 
      //  and if needed, replace them when unparsing to send back to service
      google.maps.event.addListener(path, 'set_at', () => {
        if (!WktUtils.isClosedPath(path)) {
          // IMPORTANT to check if it is already a closed path,
          // otherwise we will get into an infinite loop when trying to keep it closed
          if (index === 0) {
            // The first point has been moved, move the last point of
            // the polygon to keep it a valid, closed polygon
            path.setAt(0, path.getAt(path.length - 1))
            this.modifyBoundaryShape(mapObject)
          } else if (index === path.length - 1) {
            // The last point has been moved, move the first point of
            // the polygon to keep it a valid, closed polygon
            path.setAt(path.length - 1, path.getAt(0))
            this.modifyBoundaryShape(mapObject)
          }
        } else {
          this.modifyBoundaryShape(mapObject)
        }
      })
    })

    mapObject.addListener('contextmenu', event => {
      this.contextMenuClick(event)
    })
    
    mapObject.addListener('click', event => {
      if (event.vertex) {
        event.domEvent.stopPropagation()
        if (event.domEvent.shiftKey) {
          this.multiSelectVertices.addOrRemoveMarker(event)
        }
      }
    })

    if (this.clickOutListener) {
      google.maps.event.removeListener(this.clickOutListener)
    }
    this.clickOutListener = this.props.googleMaps.addListener('click', event => {
      // Any click that is outside of the polygon will deselect all vertices
      if (this.mapObjectOverlay.length > 0) this.clearMapObjectOverlay()
    })
    if (this.deleteKeyListener) google.maps.event.removeListener(this.deleteKeyListener)
    this.deleteKeyListener = google.maps.event.addDomListener(document, 'keydown', (e) => {
      const code = (e.keyCode ? e.keyCode : e.which)
      // 8 = Backspace
      // 46 = Delete
      // Supporting both of these because not all keyboards have a 'delete' key
      if ((code === 8 || code === 46) && this.multiSelectVertices.mapObjectOverlay.length > 0) {
        // Sort is necessary to ensure that indexes will not be reassigned while deleting more than one vertex.
        const mapObjectOverlayClone = [...this.multiSelectVertices.mapObjectOverlay]
        // Using this.mapObject as the argument being passed instead of the one in the parent function is the only way this consistently works.
        this.props.deleteBoundaryVertices(this.mapObject, mapObjectOverlayClone, this.clearMapObjectOverlay)
      }
    })
  }
  
  clearAll () {
    // Clear all markers from map when clearing poly
    if (this.multiSelectVertices) {
      this.clearMapObjectOverlay()
    }
    this.deleteMapObject()
    // Remove global listeners on tear down
    google.maps.event.removeListener(this.clickOutListener)
    this.clickOutListener = null
    google.maps.event.removeListener(this.deleteKeyListener)
    this.deleteKeyListener = null
  }

  contextMenuClick(event) {
    let vertexPayload
    const overlay = this.multiSelectVertices.mapObjectOverlay
    if(overlay.length > 0) {
      const indexOfMarker = this.multiSelectVertices.markerIndex(event.vertex)
      
      if (event.vertex && indexOfMarker === -1) {
        // Add vertex to array if it doesn't already exist there.
        this.multiSelectVertices.addMarker(event)
      }
      vertexPayload = overlay
    } else {
      vertexPayload = event.vertex
    }

    const eventXY = WktUtils.getXYFromEvent(event)
    this.props.showContextMenuForBoundary(
      this.mapObject,
      eventXY.x,
      eventXY.y,
      vertexPayload,
      this.clearMapObjectOverlay
    )
  }

  componentWillUnmount () {
    this.clearAll()
  }
}

const mapStateToProps = state => ({
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  googleMaps: state.map.googleMaps,
  subnets: state.planEditor.subnets,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  planType: state.plan.activePlan.planType
})

const mapDispatchToProps = dispatch => ({
  showContextMenuForBoundary: (mapObject, x, y, vertex, callBack) => {
    dispatch(PlanEditorActions.showContextMenuForBoundary(mapObject, x, y, vertex, callBack))
  },
  boundaryChange: (subnetId, geometry) => dispatch(PlanEditorActions.boundaryChange(subnetId, geometry)),
  deleteBoundaryVertices: (mapObjects, vertices, callBack) => {
    dispatch(PlanEditorActions.deleteBoundaryVertices(mapObjects, vertices, callBack))
  },
})

const EquipmentBoundaryMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentBoundaryMapObjects)
export default EquipmentBoundaryMapObjectsComponent
