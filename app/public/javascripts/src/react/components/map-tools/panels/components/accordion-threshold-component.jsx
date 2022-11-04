import React, { useState, useEffect } from 'react'
import { klona } from 'klona'
import { connect } from 'react-redux'
import { Slider, RangeSlider, Switch } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionThreshold = (props) => {
  const {
    filter,
    updateMapLayerFilters,
    layer
  } = props
  const [sliderValue, setSliderValue] = useState(filter.value)
  const [noMax, setNoMax] = useState(true)
  const [noMin, setNoMin] = useState(true)
  const [Component, setComponent] = useState(RangeSlider)

  const marks = [.25, .5, .75].map(markSteps => {
    const value = filter.maxValue * markSteps
    return { value }
  })

  const createLabel = (value) => {
    let newValue = klona(value);
    let isNoMax = false;
    let isNoMin = false;
    if (Array.isArray(sliderValue)) {
      isNoMax = !!(noMax && newValue === sliderValue[1] && filter.unboundedMax)
      isNoMin = !!(noMin && newValue === sliderValue[0] && filter.unboundedMin)
      console.log(value, isNoMin, isNoMax)
      if (isNoMax) newValue = "No Max"
      if (isNoMin) newValue = "No Min"
    }
    return (isNoMax || isNoMin)
      ? newValue
      : `${filter.labelPrefix ? filter.labelPrefix : ''}${value.toLocaleString('en-US')}${filter.labelSuffix ? filter.labelSuffix : ''}`
  }

  const createPayload = (value, noMaxValue, noMinValue) => {
    const payload = {}
    let newValue = klona(value)
    if (filter.labelSuffix === '%') {
      // scale to decimal
      newValue = newValue.map(range => range / 100)
    }
    payload[filter.type] = newValue
    payload.noMax = filter.unboundedMax ? noMaxValue : false
    payload.noMin = filter.unboundedMin ? noMinValue : false

    return payload
  }

  useEffect(() => {
    setComponent(filter.type === 'rangeThreshold' ? RangeSlider : Slider)
    const payload = createPayload(sliderValue, noMax, noMin)
    updateMapLayerFilters(layer, filter.attributeKey, payload)
  }, [])

  const calculateStep = () => {
    return filter.step || (filter.maxValue - filter.minValue) / 100
  }
  
  const onFilterChange = (value) => {
    // Check if max value is set or min value is set
    const newNoMax = !!(value[1] === filter.maxValue && filter.unboundedMax)
    const newNoMin = !!(value[0] === filter.minValue && filter.unboundedMin)

    setSliderValue(value)
    setNoMax(newNoMax)
    setNoMin(newNoMin)
    const payload = createPayload(value, newNoMax, newNoMin)
    debounceDispatch(layer, filter.attributeKey, payload)
  }

  const debounceDispatch = _.debounce(updateMapLayerFilters, 250)

  return (
    <div>
      <Component
        min={filter.minValue}
        max={filter.maxValue}
        step={calculateStep()}
        label={(value) => createLabel(value || 0)}
        marks={filter.marks || marks}
        value={sliderValue}
        onChange={(value) => {
          onFilterChange(value)
        }}
        labelAlwaysOn
        styles={{
          root: {
            marginTop: '1.5em',
            width: '97%'
          },
          label: {
            backgroundColor: '#228be6',
            color: '#fff'
          },
        }}
      />
    </div>
  )
}

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = (dispatch) => ({
  updateMapLayerFilters: (layer, key, value) => dispatch(MapLayerActions.updateMapLayerFilters(layer, key, value)),
})

const AccordionThresholdComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionThreshold)
export default AccordionThresholdComponent