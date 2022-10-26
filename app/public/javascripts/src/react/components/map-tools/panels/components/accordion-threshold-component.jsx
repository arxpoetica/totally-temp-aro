import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Slider, RangeSlider, Switch } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionThreshold = (props) => {
  const {
    filter,
    updateMapLayerFilters,
  } = props
  const [sliderValue, setSliderValue] = useState(filter.value)
  const [noMax, setNoMax] = useState(true)

  const marks = [.25, .5, .75].map(markSteps => {
    const value = filter.maxValue * markSteps
    return { value }
  })

  const Component = filter.type === 'rangeThreshold'
    ? RangeSlider
    : Slider

  const createLabel = (value) => {
    return `${filter.labelPrefix ? filter.labelPrefix : ''}${value.toLocaleString('en-US')}${filter.labelSuffix ? filter.labelSuffix : ''}`
  }

  const createPayload = (sVal, noMaxValue) => {
    const payload = {}
    payload[filter.type] = sVal
    payload.noMax = noMaxValue

    return payload
  }

  useEffect(() => {
    const payload = createPayload(sliderValue, noMax)
    updateMapLayerFilters('near_net', filter.attributeKey, payload)
  }, [])
  
  const onFilterChange = (value) => {
    const payload = createPayload(value, noMax)
    setSliderValue(value)
    debounceDispatch('near_net', filter.attributeKey, payload)
  }

  const debounceDispatch = _.debounce(updateMapLayerFilters, 250)

  return (
    <div>
      <Component
        min={filter.minValue}
        max={filter.maxValue}
        step={filter.step || (filter.maxValue - filter.minValue) / 100}
        label={(value) => createLabel(value)}
        marks={filter.marks || marks}
        value={sliderValue}
        onChange={(value) => {
          onFilterChange(value)
        }}
        disabled={filter.unboundedMax ? noMax : false}
        labelAlwaysOn
        styles={{
          root: {
            marginTop: '1.5em',
            marginBottom: !filter.unboundedMax && '1em',
            width: '97%'
          },
          label: {
            backgroundColor: '#228be6',
            color: '#fff'
          }
        }}
      />
      {filter.unboundedMax && (
        <Switch
          label="No Maximum"
          onChange={() => {
            const payload = createPayload(sliderValue, !noMax)
            setNoMax(!noMax)
            updateMapLayerFilters('near_net', filter.attributeKey, payload)
          }}
          styles={{
            root: {
              justifyContent: 'end',
              marginTop: '1em'
            }
          }}
        />
      )}
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    nearNetFilters: state.mapLayers.filters.near_net
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateMapLayerFilters: (layer, key, value) => dispatch(MapLayerActions.updateMapLayerFilters(layer, key, value)),
})

const AccordionThresholdComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionThreshold)
export default AccordionThresholdComponent