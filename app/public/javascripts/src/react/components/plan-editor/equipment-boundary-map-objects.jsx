/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import Utils from './utils'

export class EquipmentBoundaryMapObjects extends Component {
  constructor (props) {
    super(props)
    this.objectIdToMapObject = {}
    this.polygonOptions = {
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF1493',
      fillOpacity: 0.4
    }
  }

  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate () {
    const createdIds = new Set(Object.keys(this.objectIdToMapObject))
    const allEquipmentIds = new Set(
      Object.keys(this.props.transactionFeatures)
        .filter(objectId => this.props.transactionFeatures[objectId].feature.dataType === 'equipment_boundary')
    )
    const idsToCreate = [...allEquipmentIds].filter(objectId => !createdIds.has(objectId))
    const idsToDelete = [...createdIds].filter(objectId => !allEquipmentIds.has(objectId))
    const idsToUpdate = [...allEquipmentIds].filter(objectId => createdIds.has(objectId))
    idsToCreate.forEach(objectId => this.createMapObject(objectId))
    idsToDelete.forEach(objectId => this.deleteMapObject(objectId))
    idsToUpdate.forEach(objectId => this.updateBoundaryShapeFromStore(objectId))
  }

  createMapObject (objectId) {
    const equipmentBoundary = this.props.transactionFeatures[objectId].feature
    const mapObject = new google.maps.Polygon({
      objectId: equipmentBoundary.objectId, // Not used by Google Maps
      paths: Utils.getGoogleMapPathsFromGeometry(equipmentBoundary.geometry),
      clickable: true,
      draggable: false,
      editable: true,
      map: this.props.googleMaps
    })
    mapObject.setOptions(this.polygonOptions)
    this.setupListenersForMapObject(mapObject)

    // mapObject.addListener('rightclick', event => {
    //   const eventXY = this.getXYFromEvent(event)
    //   this.props.showContextMenuForEquipment(this.props.planId, this.props.transactionId, this.props.selectedBoundaryTypeId, mapObject.objectId, eventXY.x, eventXY.y)
    // })
    this.objectIdToMapObject[objectId] = mapObject
  }

  deleteMapObject (objectId) {
    this.objectIdToMapObject[objectId].setMap(null)
    delete this.objectIdToMapObject[objectId]
  }

  updateBoundaryShapeFromStore (objectId) {
    const geometry = this.props.transactionFeatures[objectId].feature.geometry
    const mapObject = this.objectIdToMapObject[objectId]
    mapObject.setPath(Utils.getGoogleMapPathsFromGeometry(geometry))
    this.setupListenersForMapObject(mapObject)
  }

  modifyBoundaryShape (mapObject) {
    var newEquipment = JSON.parse(JSON.stringify(this.props.transactionFeatures[mapObject.objectId]))
    newEquipment.feature.geometry = Utils.getGeometryFromGoogleMapPaths(mapObject.getPaths())
    this.props.modifyEquipmentBoundary(this.props.transactionId, newEquipment)
  }

  setupListenersForMapObject (mapObject) {
    const self = this
    mapObject.getPaths().forEach(function (path, index) {
      google.maps.event.addListener(path, 'insert_at', function () {
        self.modifyBoundaryShape(mapObject)
      })
      google.maps.event.addListener(path, 'remove_at', function () {
        self.modifyBoundaryShape(mapObject)
      })
      google.maps.event.addListener(path, 'set_at', function () {
        if (!Utils.isClosedPath(path)) {
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
  }

  getXYFromEvent (event) {
    var mouseEvent = null
    Object.keys(event).forEach((eventKey) => {
      if (event[eventKey] instanceof MouseEvent) {
        mouseEvent = event[eventKey]
      }
    })
    return {
      x: mouseEvent.clientX,
      y: mouseEvent.clientY
    }
  }

  componentWillUnmount () {
    Object.keys(this.objectIdToMapObject).forEach(objectId => this.deleteMapObject(objectId))
  }
}

EquipmentBoundaryMapObjects.propTypes = {
  transactionId: PropTypes.number,
  transactionFeatures: PropTypes.object,
  selectedBoundaryTypeId: PropTypes.number,
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  selectedBoundaryTypeId: state.mapLayers.selectedBoundaryType.id,
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  modifyEquipmentBoundary: (transactionId, equipmentBoundary) => dispatch(PlanEditorActions.modifyEquipmentBoundary(transactionId, equipmentBoundary))
  // showContextMenuForEquipment: (planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y) => {
  //   dispatch(PlanEditorActions.showContextMenuForEquipment(planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y))
  // }
})

const EquipmentBoundaryMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentBoundaryMapObjects)
export default EquipmentBoundaryMapObjectsComponent
