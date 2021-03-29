import React, { useState } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import Select, { components } from 'react-select'
import AroHttp from '../../common/aro-http'
import uuidStore from '../../../shared-utils/uuid-store'
// import cx from 'clsx'

const ToolBarSearch = ({ defaultPlanCoordinates }) => {

  const [options, setOptions] = useState([])

  let timer
  const handleInputChange = (searchTerm, { action }) => {
    if (action === 'input-change') {
      clearTimeout(timer)
      timer = setTimeout(async() => {
        const params = new URLSearchParams({
          text: searchTerm,
          sessionToken: uuidStore.getInsecureV4UUID(),
          biasLatitude: defaultPlanCoordinates.latitude,
          biasLongitude: defaultPlanCoordinates.longitude,
        })
        const { data } = await AroHttp.get(`/search/addresses?${params.toString()}`)
        setOptions(data.map(option => {
          option.label = option.displayText
          return option
        }))
      }, 250)
    }
  }

  const handleChange = changes => {
    console.log(changes)
  }

  return (
    <div className="aro-toolbar-search" style={{flex: '0 0 250px', margin: 'auto', width: '250px'}}>
      <Select
        options={options}
        placeholder="Search for a location..."
        filterOption={() => true}
        onInputChange={handleInputChange}
        onChange={handleChange}
      />
        {/* cacheOptions */}
        {/* defaultOptions */}
    </div>
  )
}

const mapStateToProps = (state) => ({
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates,
})

const mapDispatchToProps = (dispatch) => ({})

export default wrapComponentWithProvider(reduxStore, ToolBarSearch, mapStateToProps, mapDispatchToProps)
