/* globals google */
import { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Point from '../../../common/point'

export class RfpTargetsMap extends Component {
  constructor (props) {
    super(props)
    this.createdMapObjects = []
  }

  render () {
    // No UI for this component. This component will render map targets onto the google maps object.
    return null
  }

  componentDidUpdate (prevProps) {
    if (prevProps.targets !== this.props.targets) {
      this.props.targets.forEach(target => {
        const mapObj = new google.maps.Marker({
          position: target,
          map: this.props.googleMaps,
          icon: '/images/map_icons/aro/target.png'
        })
        this.createdMapObjects.push(mapObj)
      })
    }
  }

  componentWillUnmount () {
    this.createdMapObjects.forEach(mapObj => mapObj.setMap(null))
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
