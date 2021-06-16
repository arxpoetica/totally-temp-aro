import React, { useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import { selectStyles } from '../../common/view-utils.js'
import AroHttp from '../../common/aro-http'
import uuidStore from '../../../shared-utils/uuid-store'
// import cx from 'clsx'

const ToolBarSearch = ({ defaultPlanCoordinates, mapRef }) => {

  const [options, setOptions] = useState([])

  let timer
  const handleInputChange = (searchTerm, { action }) => {
    if (action === 'input-change') {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const params = new URLSearchParams({
          text: searchTerm,
          sessionToken: uuidStore.getInsecureV4UUID(),
          biasLatitude: defaultPlanCoordinates.latitude,
          biasLongitude: defaultPlanCoordinates.longitude,
        })
        AroHttp.get(`/search/addresses?${params.toString()}`)
          .then(({ data }) => {
            setOptions(data.map(option => {
              option.label = option.displayText
              return option
            }))
          })
      }, 250)
    }
  }

  const handleChange = change => {
    if (change.type === 'error') {
      console.error('ERROR when searching for location')
      console.error(change)
      return
    }

    if (change.type === 'placeId') {
      // This is a google maps place_id.
      // The actual latitude/longitude can be obtained by another call to the geocoder
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ 'placeId': change.value }, (results, status) => {
        if (status !== 'OK') {
          console.error('Geocoder failed: ' + status)
          return
        }
        const { lat, lng } = results[0].geometry.location
        setMarker(lat(), lng())
      })
    } else if (change.type === 'latlng') {
      setMarker(+change.value[0], +change.value[1])
    }
  }

  function setMarker(latitude, longitude) {
    const mapObject = { latitude, longitude, zoom: 17 }
    const event = new CustomEvent('mapChanged', { detail: mapObject })
    window.dispatchEvent(event)
    const marker = new google.maps.Marker({
      map: mapRef,
      animation: google.maps.Animation.BOUNCE,
      position: { lat: latitude, lng: longitude }
    })
    setTimeout(() => { marker.setMap(null) }, 5000)
  }

  return (
    <div className="aro-toolbar-search" style={{ flex: '0 0 250px', margin: 'auto', width: '250px' }}>
      <Select
        options={options}
        placeholder="Search for a location..."
        filterOption={() => true}
        onInputChange={handleInputChange}
        onChange={handleChange}
        onFocus={() => setOptions([])}
        onBlur={() => setOptions([])}
        styles={selectStyles}
      />
    </div>
  )
}

const mapStateToProps = (state) => ({
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates,
  mapRef: state.map.googleMaps,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(ToolBarSearch)
