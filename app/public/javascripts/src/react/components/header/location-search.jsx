import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Select, Avatar } from '@mantine/core'
import AroHttp from '../../common/aro-http'
import uuidStore from '../../../shared-utils/uuid-store'
import PlanActions from '../plan/plan-actions.js'
import ToolBarActions from './tool-bar-actions.js'

const ToolBarSearch = (props) => {

  const [options, setOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { defaultPlanCoordinates, mapRef, currentView, plan, loadPlan } = props

  const handleInputChange = (newSearchTerm) => {
    const promises = []
    const params = new URLSearchParams({
      text: newSearchTerm,
      sessionToken: uuidStore.getInsecureV4UUID(),
      biasLatitude: defaultPlanCoordinates.latitude,
      biasLongitude: defaultPlanCoordinates.longitude,
    })
    if (!newSearchTerm) {
      setOptions([])
      return
    }
    const esc = encodeURIComponent
    promises.push(AroHttp.get(`/search/addresses?${params.toString()}`))
    promises.push(AroHttp.get(`/service/v1/plan?search="${esc(newSearchTerm)}"`))
    Promise.all(promises).then((searchData) => {
      setOptions([
        ...searchData[0].data.map(option => {
          option.label = option.displayText
          if (option.type === 'latlng') {
            option.label = newSearchTerm
            option.customLabel = `Lat: ${option.value[0]}, Long: ${option.value[1]}`
          }
          option.image = '/images/map_icons/aro/crosshairs-solid.svg'
          delete option.displayText
          
          return option
        }),
        ...searchData[1].data.map(option => {
          const newOption = {
            label: option.name,
            value: option.name,
            image: '/images/map_icons/aro/folder-open-regular.svg',
            selectType: 'plan',
            id: option.id
          }

          return newOption
        }),
      ])
    })
  }

  const debounceHandleInputChange = _.debounce(handleInputChange, 250)

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

        // While Editing the existing plan, if user modified the location details then update the plan,
        // When location change from top tool-bar search box, update the 'lat', 'lag' to change the marker values.
        if (currentView && currentView === 'viewModePlanInfo') {
          plan.areaName = change.label
          plan.latitude = results[0].geometry.location.lat()
          plan.longitude = results[0].geometry.location.lng()
          AroHttp.put(`/service/v1/plan`, plan)
        } else if (currentView && currentView !== 'viewModePlanInfo') { 
          const { lat, lng } = results[0].geometry.location
          setMarker(lat(), lng()) 
        }
      })
    } else if (change.type === 'latlng') {
      if (currentView && currentView !== 'viewModePlanInfo') { setMarker(+change.value[0], +change.value[1]) }
    } else if (change.selectType === 'plan') {
      loadPlan(change.id)
    }
  }

  function setMarker(latitude, longitude) {
    const mapObject = { latitude, longitude, zoom: 17 }
    const event = new CustomEvent('mapChanged', { detail: mapObject })
    window.dispatchEvent(event)
    const marker = new google.maps.Marker({
      map: mapRef,
      animation: google.maps.Animation.BOUNCE,
      position: { lat: latitude, lng: longitude },
      optimized: !ARO_GLOBALS.MABL_TESTING,
    })
    setTimeout(() => { marker.setMap(null) }, 5000)
  }
  // this forward ref junk is to prevent an error on mantine's end
  // that causes a giant red error message to show in console.
  const SelectItem = React.forwardRef((props, ref) => {
    return (
      <div
        ref={ref}
        onClick={() => {
          handleInputChange('')
          handleChange(props)
        }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        {props.customLabel || props.label}
        <Avatar src={props.image} size='xs' />
      </div>
    )
  })
  
  return (
    <div className="aro-toolbar-search" style={{ flex: '0 0 250px', margin: 'auto', width: '250px' }}>
      <Select
        searchable
        data={options}
        placeholder="Search for a location or plan..."
        onSearchChange={(value) => {
          setSearchTerm(value)
          debounceHandleInputChange(value)
        }}
        searchvalue={searchTerm}
        itemComponent={SelectItem}
        styles={{
          wrapper: {
            margin: '2px'
          }
        }}
      />
    </div>
  )
}

const mapStateToProps = (state) => ({
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates,
  mapRef: state.map.googleMaps,
  plan: state.plan.activePlan,
})
const mapDispatchToProps = dispatch => ({
  editActivePlan: (plan) => dispatch(PlanActions.editActivePlan(plan)),
  loadPlan: (planId) => dispatch(ToolBarActions.loadPlan(planId)),
})
export default connect(mapStateToProps, mapDispatchToProps)(ToolBarSearch)
