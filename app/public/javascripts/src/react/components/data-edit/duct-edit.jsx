/* global google, swal */
import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export class DuctEdit extends Component {
  constructor (props) {
    super(props)

    this.createdMapObjects = []
    this.mapObjectListeners = []
    // this.mapClickListener = null
    this.points = []
    this.state = {
      points: []
    }
  }

  render () {
    this.drawLine()
    var markUp = []
    this.state.points.forEach(point => {
      markUp.push(
        <div>
          {JSON.stringify(point)}
        </div>
      )
    })
    return (
      <div>
        {markUp}
      </div>
    )
  }

  drawLine () {
    this.clearRendering()
    var ringPath = new google.maps.Polyline({
      path: this.state.points,
      geodesic: true,
      strokeColor: '#543500',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      clickable: false,
      draggable: false
    })
    ringPath.setMap(this.props.map.googleMaps)
    this.createdMapObjects.push(ringPath)
  }

  addPoint (point) {
    this.setState({
      points: this.state.points.concat([point])
    })
  }

  clearRendering () {
    this.createdMapObjects.forEach(path => {
      path.setMap(null)
    })
    this.createdMapObjects = []

    this.mapObjectListeners.forEach(listener => {
      listener.remove()
    })
    this.mapObjectListeners = []
  }
  /*
  selectNewestRing () {
    var ringId = Object.keys(this.props.rings).sort().pop()
    this.props.setSelectedRingId(ringId)
  }
  */
  componentDidMount () {
    /*
    if (!this.props.selectedRingId) {
      this.selectNewestRing()
    }
    */
    this.mapClickListener = this.props.map.googleMaps.addListener('click', event => this.addPoint(event.latLng))
  }

  componentWillUnmount () {
    this.clearRendering()
    this.mapClickListener.remove()
  }
}

const mapStateToProps = (state) => ({
  plan: state.plan,
  user: state.user,
  map: state.map
})

const mapDispatchToProps = dispatch => ({
  
})

const DuctEditComponent = wrapComponentWithProvider(reduxStore, DuctEdit, mapStateToProps, mapDispatchToProps)
export default DuctEditComponent
