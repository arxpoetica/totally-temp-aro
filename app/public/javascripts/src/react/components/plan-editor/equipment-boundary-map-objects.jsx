/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import SelectionActions from '../selection/selection-actions'
import WktUtils from '../../../shared-utils/wkt-utils'

export class EquipmentBoundaryMapObjects extends Component {
  constructor (props) {
    super(props)
    this.mapObject = undefined
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
  }

  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate (prevProps, prevState) {
    // any changes to state props should cause a rerender
    const {subnets, subnetFeatures} = this.props
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
        parentSubnetId = subnetFeatures[rootSubnetId].subnetId
      }
      let newNeighborIds = subnets[rootSubnetId].children.concat([rootSubnetId])
      // may need to ensure newNeighborIds are all unique 
      let index = newNeighborIds.indexOf(selectedSubnetId)
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

      let idsToCreate = []
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

  createMapObject (selectedSubnetId) {
    // const equipmentBoundary = this.props.transactionFeatures[objectId].feature
    if (!this.props.subnets[selectedSubnetId]) return
    const geometry = this.props.subnets[selectedSubnetId].subnetBoundary.polygon
    const isLocked = this.props.subnets[selectedSubnetId].subnetBoundary.locked

    if (this.mapObject) this.deleteMapObject()

    this.mapObject = new google.maps.Polygon({
      subnetId: selectedSubnetId, // Not used by Google Maps
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry),
      clickable: false,
      draggable: false,
      editable: !isLocked,
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
    const geometry = this.props.subnets[subnetId].subnetBoundary.polygon

    if (this.neighborObjectsById[subnetId]) {
      this.deleteNeighbors([subnetId])
    }

    let neighborObject = new google.maps.Polygon({
      subnetId: subnetId, // Not used by Google Maps
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry),
      clickable: false,
      draggable: false,
      editable: false,
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
      const eventXY = WktUtils.getXYFromEvent(event)
      self.props.showContextMenuForEquipmentBoundary(mapObject, eventXY.x, eventXY.y, event.vertex)
    })
  }

  clearAll () {
    this.deleteMapObject()
    // delete all neighbors
    this.deleteNeighbors(Object.keys(this.neighborObjectsById))
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
})

const mapDispatchToProps = dispatch => ({
  modifyFeature: (equipmentBoundary) => dispatch(PlanEditorActions.modifyFeature('equipment_boundary', equipmentBoundary)),
  showContextMenuForEquipmentBoundary: (mapObject, x, y, vertex) => {
    dispatch(PlanEditorActions.showContextMenuForEquipmentBoundary(mapObject, x, y, vertex))
  },
  boundaryChange: (subnetId, geometry) => dispatch(PlanEditorActions.boundaryChange(subnetId, geometry)),
  selectBoundary: objectId => dispatch(SelectionActions.setPlanEditorFeatures([objectId])),
})

const EquipmentBoundaryMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentBoundaryMapObjects)
export default EquipmentBoundaryMapObjectsComponent
