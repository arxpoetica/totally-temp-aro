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
    return `${filter.labelPrefix ? filter.labelPrefix : ''}${value.toLocaleString('en-US')}${filter.labelSuffix ? filter.labelSuffix : ''}`
  }

  const createPayload = ({ value, noMaxValue, noMinValue }) => {
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
    const payload = createPayload({ value: sliderValue, noMaxValue: noMax, noMinValue: noMin })
    updateMapLayerFilters(layer, filter.attributeKey, payload)
  }, [])

  const calculateStep = () => {
    return filter.step || (filter.maxValue - filter.minValue) / 100
  }
  
  const onFilterChange = (value) => {
    let newSliderValue = value
    if (Array.isArray(sliderValue) && !Array.isArray(value)) {
      newSliderValue = klona(sliderValue)
      // We want to mantain the array if it was a range
      // but we want it to go to the component as a single digit
      newSliderValue[noMax ? 0 : 1] = value
      
      // while maintaining a seperation between the 2 sliders in a range
      // until max or min is reached
      const clamp = (num) => Math.min(Math.max(num, filter.minValue), filter.maxValue)
      newSliderValue[noMax ? 1 : 0] = noMax 
        ? clamp(value + (calculateStep() * 10))
        : clamp(value - (calculateStep() * 10))
    }
    const payload = createPayload({ value: newSliderValue, noMaxValue: noMax, noMinValue: noMin})
    setSliderValue(newSliderValue)
    debounceDispatch(layer, filter.attributeKey, payload)
  }

  const onSwitchChange = (payload, setSwitchValue) => {
    const key = Object.keys(payload)[0]
    key === 'noMinValue'
      ? payload.noMaxValue = noMax
      : payload.noMinValue = noMin
    
    payload.value = sliderValue
    setSwitchValue(payload[key])
    const newPayload = createPayload(payload)
    updateMapLayerFilters(layer, filter.attributeKey, newPayload)
  }

  const onlyNoMaxOrNoMin = (noMaxValue = noMax, noMinValue = noMin) => {
    return (noMaxValue && !noMinValue) || (!noMaxValue && noMinValue)
  }

  const debounceDispatch = _.debounce(updateMapLayerFilters, 250)

  return (
    <div>
      <Component
        min={filter.minValue}
        max={filter.maxValue}
        step={calculateStep()}
        label={(value) => createLabel(value || "0")}
        marks={filter.marks || marks}
        value={
          onlyNoMaxOrNoMin()
            ? sliderValue[noMax ? 0 : 1]
            : sliderValue
        }
        onChange={(value) => {
          onFilterChange(value)
        }}
        labelAlwaysOn
        inverted={!noMin && noMax}
        disabled={filter.unboundedMax && filter.unboundedMin && noMax && noMin}
        styles={{
          root: {
            marginTop: '1.5em',
            marginBottom: !filter.unboundedMax && '1em',
            width: '97%'
          },
          label: {
            backgroundColor: '#228be6',
            color: '#fff'
          },
          markFilled: {
            border: noMax && !noMin && 'none'
          },
          mark: {
            border: noMax && !noMin && 'none'
          }
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        {filter.unboundedMin && (
          <Switch
            label={`<= ${createLabel(filter.minValue)}`}
            checked={noMin}
            onChange={() => {
              setComponent(onlyNoMaxOrNoMin(noMax, !noMin) ? Slider : RangeSlider)
              onSwitchChange({ noMinValue: !noMin }, setNoMin)
            }}
            styles={{
              root: {
                justifyContent: 'end',
                marginTop: '1em'
              }
            }}
          />
        )}
        {filter.unboundedMax && (
          <Switch
            label={`>= ${createLabel(filter.maxValue)}`}
            checked={noMax}
            onChange={() => {
              setComponent(onlyNoMaxOrNoMin(!noMax, noMin) ? Slider : RangeSlider)
              onSwitchChange({ noMaxValue: !noMax }, setNoMax)
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