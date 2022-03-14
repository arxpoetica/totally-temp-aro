import React, { useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../../shared-utils/wkt-utils'

const Boundary = props => {

  const { id, polygon, options, onLoad, googleMaps } = props
  const didUpdatePolygonRef = useRef(false)
  const didUpdateOptionsRef = useRef(false)
  const mapObject = useRef()

  useEffect(() => {

    const defaultOptions = {
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(polygon),
      clickable: false,
      draggable: false,
      editable: false,
      map: googleMaps,
      // strokeColor: '#1f7de6',
      strokeColor: '#777777',
      strokeWeight: 3,
      // fillColor: '#1f7de6',
      fillColor: '#777777',
      fillOpacity: 0.05,
    }

    // these two properties are for our convenience, not used by google maps
    options.itemType = 'boundary'
    if (id) options.itemId = id

    const mergedOptions = Object.assign(defaultOptions, { ...options })
    mapObject.current = new google.maps.Polygon(mergedOptions)

    // TODO: should this have an `onUnload`?????
    onLoad(mapObject.current)

    return () => { mapObject.current.setMap(null) }
  }, [])

  useEffect(() => {
    if (didUpdatePolygonRef.current) {
      const paths = WktUtils.getGoogleMapPathsFromWKTMultiPolygon(polygon)
      mapObject.current.setPaths(paths)
    }
    didUpdatePolygonRef.current = true
  }, [polygon])

  useEffect(() => {
    if (didUpdateOptionsRef.current) mapObject.current.setOptions(options)
    didUpdateOptionsRef.current = true
  }, [options])

  // no ui for this component
  return null
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(Boundary)
