/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Point from '../../../common/point'

export class RfpTargetsMap extends Component {
  constructor (props) {
    super(props)
    this.createdMapObjects = {}
  }

  render () {
    // No UI for this component. This component will render map targets onto the google maps object.
    return null
  }

  componentDidUpdate (prevProps) {
    if (prevProps.targets !== this.props.targets) {
      // Determine the map objects to create
      const existingTargetIds = new Set(Object.keys(this.createdMapObjects))
      const targetsToCreate = this.props.targets.filter(newTarget => !existingTargetIds.has(newTarget.id))
      this.createMapObjects(targetsToCreate)

      // Determine the map objects to delete
      const newTargetIds = new Set(this.props.targets.map(target => target.id))
      const targetIdsToDelete = [...existingTargetIds].filter(targetId => !newTargetIds.has(targetId))
      targetIdsToDelete.forEach(id => this.deleteMapObject(id))
    }
    if (prevProps.selectedTarget !== this.props.selectedTarget) {
      // Clear the old selected targets marker (if any)
      if (prevProps.selectedTarget) {
        const marker = this.createdMapObjects[prevProps.selectedTarget.id]
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
  }

  createMapObjects (targets) {
    targets.forEach(target => {
      const mapObj = new google.maps.Marker({
        id: target.id,
        position: { lat: target.lat, lng: target.lng },
        map: this.props.googleMaps,
        icon: '/images/map_icons/aro/target.png'
      })
      this.createdMapObjects[target.id] = mapObj
    })
  }

  deleteMapObject (objectId) {
    this.createdMapObjects[objectId].setMap(null)
    delete this.createdMapObjects[objectId]
  }

  componentWillUnmount () {
    Object.keys(this.createdMapObjects).forEach(objectId => this.deleteMapObject(objectId))
  }
}

RfpTargetsMap.propTypes = {
  googleMaps: PropTypes.object,
  targets: PropTypes.arrayOf(PropTypes.instanceOf(Point)),
  selectedTarget: PropTypes.instanceOf(Point)
}

const mapStateToProps = (state) => ({
  googleMaps: state.map.googleMaps,
  targets: state.optimization.rfp.targets,
  selectedTarget: state.optimization.rfp.selectedTarget
})

const mapDispatchToProps = dispatch => ({
})

const RfpTargetsMapComponent = wrapComponentWithProvider(reduxStore, RfpTargetsMap, mapStateToProps, mapDispatchToProps)
export default RfpTargetsMapComponent
