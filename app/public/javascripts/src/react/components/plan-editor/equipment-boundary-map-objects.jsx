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
    this.objectIdToMapObject = {}
    this.polygonOptions = {
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
    }
    this.selectedPolygonOptions = {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
    }
  }

  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate (prevProps, prevState) {
    const { selectedSubnetId, subnets } = this.props
    if (selectedSubnetId && subnets && subnets[selectedSubnetId] !== prevProps.subnets[selectedSubnetId]) {
      this.createMapObject(selectedSubnetId)

      // const createdIds = new Set(Object.keys(this.objectIdToMapObject))
      // const allEquipmentIds = new Set(
      //   Object.keys(this.props.transactionFeatures)
      //     .filter(objectId => this.props.transactionFeatures[objectId].feature.dataType === 'equipment_boundary')
      // )
      // const idsToCreate = [...allEquipmentIds].filter(objectId => !createdIds.has(objectId))
      // const idsToDelete = [...createdIds].filter(objectId => !allEquipmentIds.has(objectId))
      // const idsToUpdate = [...allEquipmentIds].filter(objectId => createdIds.has(objectId))
      // idsToCreate.forEach(objectId => this.createMapObject(objectId))
      // idsToDelete.forEach(objectId => this.deleteMapObject(objectId))
      // idsToUpdate.forEach(objectId => this.updateBoundaryShapeFromStore(objectId))
      // this.highlightSelectedBoundaries()
    }
  }

  createMapObject (selectedSubnetId) {
    // const equipmentBoundary = this.props.transactionFeatures[objectId].feature

    const { subnets } = this.props
    const geometry = subnets[selectedSubnetId].subnetBoundary.polygon

    const mapObject = new google.maps.Polygon({
      // objectId: equipmentBoundary.objectId, // Not used by Google Maps
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry),
      clickable: true,
      draggable: false,
      editable: true,
      map: this.props.googleMaps,
    })
    mapObject.setOptions(this.polygonOptions)
    this.setupListenersForMapObject(mapObject)

    mapObject.addListener('rightclick', event => {
      console.log('yay, you right clicked!')
      // const eventXY = WktUtils.getXYFromEvent(event)
      // this.props.showContextMenuForEquipmentBoundary(this.props.transactionId, mapObject.objectId, eventXY.x, eventXY.y)
    })
    mapObject.addListener('click', () => {
      console.log('yay! you clicked!')
      // this.props.selectBoundary(objectId)
    })
    // this.objectIdToMapObject[objectId] = mapObject
  }

  deleteMapObject (objectId) {
    // this.objectIdToMapObject[objectId].setMap(null)
    // delete this.objectIdToMapObject[objectId]
  }

  updateBoundaryShapeFromStore (objectId) {
    // const geometry = this.props.transactionFeatures[objectId].feature.geometry
    // const mapObject = this.objectIdToMapObject[objectId]
    // mapObject.setPath(WktUtils.getGoogleMapPathsFromWKTMultiPolygon(geometry))
    // this.setupListenersForMapObject(mapObject)
  }

  modifyBoundaryShape (mapObject) {
    // var newEquipment = JSON.parse(JSON.stringify(this.props.transactionFeatures[mapObject.objectId]))
    // newEquipment.feature.geometry = WktUtils.getWKTMultiPolygonFromGoogleMapPaths(mapObject.getPaths())
    // this.props.modifyFeature(this.props.transactionId, newEquipment)
  }

  setupListenersForMapObject (mapObject) {
    // const self = this
    // mapObject.getPaths().forEach(function (path, index) {
    //   google.maps.event.addListener(path, 'insert_at', function () {
    //     self.modifyBoundaryShape(mapObject)
    //   })
    //   google.maps.event.addListener(path, 'remove_at', function () {
    //     self.modifyBoundaryShape(mapObject)
    //   })
    //   google.maps.event.addListener(path, 'set_at', function () {
    //     if (!WktUtils.isClosedPath(path)) {
    //       // IMPORTANT to check if it is already a closed path, otherwise we will get into an infinite loop when trying to keep it closed
    //       if (index === 0) {
    //         // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
    //         path.setAt(0, path.getAt(path.length - 1))
    //         self.modifyBoundaryShape(mapObject)
    //       } else if (index === path.length - 1) {
    //         // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
    //         path.setAt(path.length - 1, path.getAt(0))
    //         self.modifyBoundaryShape(mapObject)
    //       }
    //     } else {
    //       self.modifyBoundaryShape(mapObject)
    //     }
    //   })
    // })
  }

  highlightSelectedBoundaries () {
    // Object.keys(this.objectIdToMapObject).forEach(objectId => {
    //   if (this.props.selectedFeatures.indexOf(objectId) >= 0) {
    //     // This boundary is selected.
    //     this.objectIdToMapObject[objectId].setOptions(this.selectedPolygonOptions)
    //     this.objectIdToMapObject[objectId].setEditable(true)
    //   } else {
    //     // This boundary is not selected.
    //     this.objectIdToMapObject[objectId].setOptions(this.polygonOptions)
    //     this.objectIdToMapObject[objectId].setEditable(false)
    //   }
    // })
  }

  componentWillUnmount () {
    // Object.keys(this.objectIdToMapObject).forEach(objectId => this.deleteMapObject(objectId))
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
  planId: state.plan.activePlan.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  selectedBoundaryTypeId: state.mapLayers.selectedBoundaryType.id,
  selectedFeatures: state.selection.planEditorFeatures,
  googleMaps: state.map.googleMaps,
  subnets: state.planEditor.subnets,
  selectedSubnetId: state.planEditor.selectedSubnetId,
})

const mapDispatchToProps = dispatch => ({
  modifyFeature: (transactionId, equipmentBoundary) => dispatch(PlanEditorActions.modifyFeature('equipment_boundary', transactionId, equipmentBoundary)),
  showContextMenuForEquipmentBoundary: (planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y) => {
    dispatch(PlanEditorActions.showContextMenuForEquipmentBoundary(planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y))
  },
  selectBoundary: objectId => dispatch(SelectionActions.setPlanEditorFeatures([objectId]))
})

const EquipmentBoundaryMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentBoundaryMapObjects)
export default EquipmentBoundaryMapObjectsComponent
