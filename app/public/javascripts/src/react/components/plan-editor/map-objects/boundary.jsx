import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../../shared-utils/wkt-utils'

const Boundary = props => {

  // const [mapObject, setMapObject] = useState(new google.maps.polygon..)
  // const mapObject = new google.maps.polygon

  // const { nodeType, subnetId, polygon, googleMaps } = props
  const { polygon, googleMaps } = props

  // FIXME: optimize this...
  useEffect(() => {
    // console.log(`the ${nodeType}/${subnetId} polygon is being rendered`)
    const mapObject = new google.maps.Polygon({
      // subnetId: selectedSubnetId, // Not used by Google Maps
      // dataType: this.props.subnets[selectedSubnetId].dataType,
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(polygon),
      clickable: false,
      draggable: false,
      editable: false,
      editable: false,
      map: googleMaps,
    })
    mapObject.setOptions({
      // strokeColor: '#1f7de6',
      strokeColor: '#999999',
      strokeWeight: 3,
      // fillColor: '#1f7de6',
      fillColor: '#999999',
      fillOpacity: 0.05,
    })
    // mapObject.setPath(...options)

    return () => {
      // DELETE IT
      mapObject.setMap(null)
    }
  }, [])

  // useEffect(() => {}, [JSON.stringify(polygon)])

  // no ui for this component
  return null
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(Boundary)
