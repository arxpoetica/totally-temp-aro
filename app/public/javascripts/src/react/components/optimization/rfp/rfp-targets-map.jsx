/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Point from '../../../common/point'
import RfpActions from './rfp-actions'

export class RfpTargetsMap extends Component {
  constructor (props) {
    super(props)
    this.createdMapObjects = {}
    this.mapObjectListeners = {}
    this.mapClickListener = google.maps.event.addListener(this.props.googleMaps, 'click', event => {
      if (this.props.clickMapToAddTarget) {
        this.props.addTargets([new Point(event.latLng.lat(), event.latLng.lng())])
        this.props.setClickMapToAddTarget(false)
      }
    })
  }

  render () {
    // No UI for this component. This component will render map targets onto the google maps object.
    return null
  }

  componentDidMount () {
    this.synchronizeTargets()
    this.synchronizeSelectedTarget(null)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.targets !== this.props.targets) {
      this.synchronizeTargets()
    }
    if (prevProps.selectedTarget !== this.props.target) {
      this.synchronizeSelectedTarget(prevProps.selectedTarget)
    }
    if (prevProps.clickMapToAddTarget !== this.props.clickMapToAddTarget) {
      this.props.googleMaps.setOptions({
        draggableCursor: (this.props.clickMapToAddTarget ? 'crosshair' : null)
      })
    }
  }

  synchronizeTargets () {
    // Determine the map objects to create
    const existingTargetIds = new Set(Object.keys(this.createdMapObjects))
    const targetsToCreate = this.props.targets.filter(newTarget => !existingTargetIds.has(newTarget.id))
    this.createMapObjects(targetsToCreate)

    // Determine the map objects to delete
    const newTargetIds = new Set(this.props.targets.map(target => target.id))
    const targetIdsToDelete = [...existingTargetIds].filter(targetId => !newTargetIds.has(targetId))
    targetIdsToDelete.forEach(id => this.deleteMapObject(id))

    // At this point we will have all markers. Update their position (some markers may have changed position)
    this.props.targets.forEach(target => this.createdMapObjects[target.id].setPosition({ lat: target.lat, lng: target.lng }))
  }

  synchronizeSelectedTarget (previousSelectedTarget = null) {
    // Clear the old selected targets marker (if any)
    if (previousSelectedTarget) {
      const marker = this.createdMapObjects[previousSelectedTarget.id]
      if (marker) {
        marker.setIcon({
          url: '/images/map_icons/aro/target.png'
        })
      }
    }
    if (this.props.selectedTarget) {
      // Pan the map to the selected target
      this.props.googleMaps.panTo({ lat: this.props.selectedTarget.lat, lng: this.props.selectedTarget.lng })
      // Make the marker icon bigger
      const marker = this.createdMapObjects[this.props.selectedTarget.id]
      if (marker) {
        marker.setIcon({
          url: '/images/map_icons/aro/target_selected.png'
        })
      }
    }
  }

  createMapObjects (targets) {
    targets.forEach(target => {
      const mapObj = new google.maps.Marker({
        id: target.id,
        position: { lat: target.lat, lng: target.lng },
        map: this.props.googleMaps,
        icon: '/images/map_icons/aro/target.png',
        draggable: true,
        optimized: !ARO_GLOBALS.MABL_TESTING,
      })
      this.mapObjectListeners[target.id] = google.maps.event.addListener(mapObj, 'dragend', event => {
        // Replace the target with another target having the same ID, but updated coordinates
        const oldTargetIndex = this.props.targets.findIndex(target => target.id === mapObj.id)
        const oldTarget = this.props.targets[oldTargetIndex]
        var newTarget = new Point(event.latLng.lat(), event.latLng.lng(), oldTarget.id)
        this.props.replaceTarget(oldTargetIndex, newTarget)
      })
      this.createdMapObjects[target.id] = mapObj
    })
  }

  deleteMapObject (objectId) {
    this.createdMapObjects[objectId].setMap(null)
    delete this.createdMapObjects[objectId]

    this.mapObjectListeners[objectId].remove()
    delete this.mapObjectListeners[objectId]
  }

  componentWillUnmount () {
    Object.keys(this.createdMapObjects).forEach(objectId => this.deleteMapObject(objectId))
    this.mapClickListener.remove()
    this.props.googleMaps.setOptions({ draggableCursor: null })
  }
}

RfpTargetsMap.propTypes = {
  googleMaps: PropTypes.object,
  targets: PropTypes.arrayOf(PropTypes.instanceOf(Point)),
  selectedTarget: PropTypes.instanceOf(Point),
  clickMapToAddTarget: PropTypes.bool
}

const mapStateToProps = (state) => ({
  googleMaps: state.map.googleMaps,
  targets: state.optimization.rfp.targets,
  selectedTarget: state.optimization.rfp.selectedTarget,
  clickMapToAddTarget: state.optimization.rfp.clickMapToAddTarget
})

const mapDispatchToProps = dispatch => ({
  addTargets: targets => dispatch(RfpActions.addTargets(targets)),
  replaceTarget: (index, target) => dispatch(RfpActions.replaceTarget(index, target)),
  setSelectedTarget: selectedTarget => dispatch(RfpActions.setSelectedTarget(selectedTarget)),
  setClickMapToAddTarget: clickMapToAddTarget => dispatch(RfpActions.setClickMapToAddTarget(clickMapToAddTarget))
})

const RfpTargetsMapComponent = wrapComponentWithProvider(reduxStore, RfpTargetsMap, mapStateToProps, mapDispatchToProps)
export default RfpTargetsMapComponent
