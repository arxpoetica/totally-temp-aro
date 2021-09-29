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
    const { selectedSubnetId, subnets, subnetFeatures } = this.props
    if (this.mapobjects.length) {
      this.deleteMapObject()
    }
    
    //TODO: prevent re-renders if fiber hasn't changed
    // if it in in subnets it is either a hub or CO, so it has it's own fiber
    if (subnets[selectedSubnetId]){
      const { subnetLinks, fiberType } = subnets[selectedSubnetId].fiber
      if (subnetLinks) {
        this.renderFiber(subnetLinks, fiberType)
      }
    } 
    else if (subnetFeatures[selectedSubnetId]) {
      //if it is a terminal get parent id and render that fiber
      const { subnetId: parentId } = subnetFeatures[selectedSubnetId]
      const { subnetLinks, fiberType } = subnets[parentId].fiber
      if (subnetLinks) {
        this.renderFiber(subnetLinks, fiberType)
      }
    }
    
  }

  renderFiber (subnetLinks, fiberType) {
    for (const subnetLink of subnetLinks) {
      const { geometry } = subnetLink
      if (geometry.type === 'LineString') {
        const path = WktUtils.getGoogleMapPathsFromWKTLineString(geometry)
        this.createMapObject(path, fiberType)
      } else if (geometry.type === 'MultiLineString') {
        const path = WktUtils.getGoogleMapPathsFromWKTMultiLineString(geometry)
        this.createMapObject(path, fiberType)
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
  subnetFeatures: state.planEditor.subnetFeatures,
})

const mapDispatchToProps = dispatch => ({
  
})

const FiberMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(FiberMapObjects)
export default FiberMapObjectsComponent
