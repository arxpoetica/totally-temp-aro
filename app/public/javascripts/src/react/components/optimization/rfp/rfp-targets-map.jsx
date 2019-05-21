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
  targets: PropTypes.arrayOf(PropTypes.instanceOf(Point))
}

const mapStateToProps = (state) => ({
  googleMaps: state.map.googleMaps,
  targets: state.optimization.rfp.targets
})

const mapDispatchToProps = dispatch => ({
})

const RfpTargetsMapComponent = wrapComponentWithProvider(reduxStore, RfpTargetsMap, mapStateToProps, mapDispatchToProps)
export default RfpTargetsMapComponent
