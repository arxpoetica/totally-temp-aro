/* globals google */
import { Component } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'

//not sure about z-index I just took this from equipment
const SELECTION_Z_INDEX = 1
const MAP_OBJECT_Z_INDEX = SELECTION_Z_INDEX + 1

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
    const {selectedSubnetId, subnets} = this.props
    if (this.mapobjects.length) {
      this.deleteMapObject()
    }

    if (subnets[selectedSubnetId]){
      const {geometry, fiberType} = subnets[selectedSubnetId].fiber
      const fiberToCreate = WktUtils.getGoogleMapPathsFromWKTMultiLineString(geometry)

      fiberToCreate.forEach(path => this.createMapObject(path, fiberType))
    }
  }

  createMapObject (path, fiberType) {

    const mapObject = new google.maps.Polyline({
      path: path, 
      clickable: false,
      map: this.props.googleMaps,
      zIndex: MAP_OBJECT_Z_INDEX,
      strokeColor: (fiberType === 'DISTRIBUTION' ? '#FF0000' : '#1700ff'),
      strokeOpacity: 1.0,
      strokeWeight: (fiberType === 'DISTRIBUTION' ? 2 : 4)
    })
    this.mapobjects.push(mapObject)
  }

  deleteMapObject () {
    if(this.mapobjects.length){
      console.log(this.mapobjects)
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
