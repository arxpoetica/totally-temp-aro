/* globals google */
import { Component } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import { constants } from './constants'

export class FiberMapObjects extends Component {
  constructor (props) {
    super(props)
    this.mapobjects = []
  }
  
  render () {
    // No UI for this component. It deals with map objects only.
    return null
  }

  componentDidUpdate () {
    const { selectedSubnetId, subnets } = this.props
    if (this.mapobjects.length) {
      this.deleteMapObject()
    }

    if (subnets[selectedSubnetId]){
      const { subnetLinks, fiberType } = subnets[selectedSubnetId].fiber

      for (const subnetLink of subnetLinks) {
        const { geometry } = subnetLink
        if (geometry.type === 'LineString') {
          const path = WktUtils.getGoogleMapPathsFromWKTLineString(geometry)
          this.createMapObject(path, fiberType)
        } else if (geometry.type === 'MultiLineString') {
          const path = WktUtils.getGoogleMapPathsFromWKTMultiLineString(geometry)
          this.createMapObject(path, fiberType)
        }
        // TODO: is there an else / alternative?
      }
    }
  }

  createMapObject (path, fiberType) {
    const mapObject = new google.maps.Polyline({
      path,
      clickable: false,
      map: this.props.googleMaps,
      zIndex: constants.Z_INDEX_MAP_OBJECT,
      strokeColor: fiberType === 'DISTRIBUTION' ? '#FF0000' : '#1700ff',
      strokeOpacity: 1.0,
      strokeWeight: fiberType === 'DISTRIBUTION' ? 2 : 4,
    })
    this.mapobjects.push(mapObject)
  }

  deleteMapObject () {
    if (this.mapobjects.length) {
      this.mapobjects.forEach(mapObject => mapObject.setMap(null))
      this.mapobjects = []
    }
  }

  componentWillUnmount () {
    // console.log(this.mapobjects)
    this.deleteMapObject()
  }
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnets: state.planEditor.subnets,
})

const mapDispatchToProps = dispatch => ({
  
})

const FiberMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(FiberMapObjects)
export default FiberMapObjectsComponent
