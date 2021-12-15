import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

const mapView = {
  hybrid: 'hybrid',
  roadmap: 'roadmap',
}
// Hold a map of 'mapTypeId' in state.js to the fontawesome icons
const buttonIcons = {
  hybrid: 'fa-globe',
  roadmap: 'fa-road',
}
let mapRefPromise = null

export const MapViewToggle = (props) => {
  const [currentMapType, setCurrentMapType] = useState(mapView.roadmap)
  const [overridenMapType, setOverridenMapType] = useState(null) // Used if the user manually clicks on a map type

  const { mapRef, userPerspective, mapType } = props

  useEffect(() => { ensureMapRefPromiseCreated() }, [])

  useEffect(() => {
    setOverridenMapType(null)
    ensureMapRefPromiseCreated() // In case it has not been created yet
    updateMapType()
  }, [userPerspective])

  const ensureMapRefPromiseCreated = () => {
    if (!mapRefPromise) {
      mapRefPromise = new Promise((resolve, reject) => {
        if (!mapRef) { reject('ERROR: You must specify the name of the global variable that contains the map object.') }
        // We should have a map variable at this point
        resolve(mapRef)
      })
    }
  }

  const updateMapType = () => {
    if (overridenMapType) {
      // The user has overriden the map type. Use it.
      mapRefPromise
        .then((mapRef) => mapRef.setMapTypeId(overridenMapType))
        .catch((err) => console.log(err))
    } else {
      // Depending upon the user perspective, set the map type on the map object
      mapRefPromise
        .then((mapRefResult) => {
          let currentMapTypeState = mapView.roadmap
          setCurrentMapType(currentMapTypeState)
          if (mapType) {
            currentMapTypeState = mapType[userPerspective] || mapType.default
            setCurrentMapType(currentMapTypeState)
          }
          mapRefResult.setMapTypeId(currentMapTypeState)
        })
        .catch((err) => console.log(err))
    }
  }

  const toggle = () => {
    const currentMapTypeState = (currentMapType === mapView.hybrid) ? mapView.roadmap : mapView.hybrid
    setCurrentMapType(currentMapTypeState)
    setOverridenMapType(currentMapTypeState)
    mapRefPromise
      .then((mapRef) => mapRef.setMapTypeId(currentMapTypeState))
      .catch((err) => console.log(err))
  }

  return (
    <button
      type="button"
      className="map-toggle"
      onClick={() => toggle()}
    >
      <i className={`fa ${buttonIcons[currentMapType]}`} />
    </button>
  )
}

const mapStateToProps = (state) => ({
  mapRef: state.map.googleMaps,
  mapType: state.toolbar.appConfiguration.mapType,
  userPerspective: state.user.loggedInUser && state.user.loggedInUser.perspective,
})

export default wrapComponentWithProvider(reduxStore, MapViewToggle, mapStateToProps, null)
