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

const MapViewToggle = (props) => {
  const [currentMapType, setCurrentMapType] = useState(mapView.roadmap)
  const [overridenMapType, setOverridenMapType] = useState(null) // Used if the user manually clicks on a map type

  const { mapRef, userPerspective, mapType, isReportMode } = props

  useEffect(() => {
    // User perspective has changed. Set the overriden configuration to null
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

  const updateMapType = async() => {
    try {
      if (overridenMapType) {
        // The user has overriden the map type. Use it.
        const mapRef = await mapRefPromise
        mapRef.setMapTypeId(overridenMapType)
      } else {
        // Depending upon the user perspective, set the map type on the map object
        const mapRefResult = await mapRefPromise
        let currentMapTypeState = mapView.roadmap
        setCurrentMapType(currentMapTypeState)
        if (mapType) {
          currentMapTypeState = mapType[userPerspective] || mapType.default
          setCurrentMapType(currentMapTypeState)
        }
        mapRefResult.setMapTypeId(currentMapTypeState)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const toggleMapView = () => {
    const currentMapTypeState = (currentMapType === mapView.hybrid) ? mapView.roadmap : mapView.hybrid
    setCurrentMapType(currentMapTypeState)
    setOverridenMapType(currentMapTypeState)
    mapRefPromise
      .then((mapRef) => mapRef.setMapTypeId(currentMapTypeState))
      .catch((err) => console.log(err))
  }

  return (
    <>
      {!isReportMode &&
        <button
          type="button"
          className="map-toggle"
          onClick={() => toggleMapView()}
        >
          <i className={`fa ${buttonIcons[currentMapType]}`} />
        </button>
      }
    </>
  )
}

const mapStateToProps = (state) => ({
  mapRef: state.map.googleMaps,
  mapType: state.toolbar.appConfiguration.mapType,
  userPerspective: state.user.loggedInUser && state.user.loggedInUser.perspective,
  isReportMode: state.mapReports.isReportMode,
})

export default wrapComponentWithProvider(reduxStore, MapViewToggle, mapStateToProps, null)
