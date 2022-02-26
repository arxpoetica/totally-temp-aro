import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../../shared-utils/wkt-utils'

const Boundary = props => {

  const { id, polygon, onLoad, googleMaps } = props

  useEffect(() => {

    const options = {
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(polygon),
      clickable: false,
      draggable: false,
      editable: false,
      map: googleMaps,
      // strokeColor: '#1f7de6',
      strokeColor: '#999999',
      strokeWeight: 3,
      // fillColor: '#1f7de6',
      fillColor: '#999999',
      fillOpacity: 0.05,
    }
    // console.log(`the ${id} polygon is being rendered`)
    // these two properties are for our convenience, not used by google maps
    options.itemType = 'boundary'
    if (id) options.itemId = id
    // // TODO: generecize this with Object
    // Object.assign(options, optionOverrides)

    const mapObject = new google.maps.Polygon(options)

    // FIXME: should this have an `onUnload`?????
    onLoad(mapObject)

    return () => { mapObject.setMap(null) }
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
