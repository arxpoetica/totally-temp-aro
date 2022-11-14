import React, { useState, useEffect } from 'react'
import { klona } from 'klona'
import { connect } from 'react-redux'
import { Slider, RangeSlider } from '@mantine/core';

const AccordionThreshold = (props) => {
  const {
    filter,
    onChange,
    data
  } = props

  const [Component, setComponent] = useState(RangeSlider)
  const [nonDebouncedValue, setNonDebouncedValue] = useState(filter.value)

  const marks = [.25, .5, .75].map(markSteps => {
    const value = filter.maxValue * markSteps
    return { value }
  })

  const createLabel = (value) => {
    let newValue = klona(value);
    let customValue = false
    if (Array.isArray(data[filter.type])) {
      if (data.noMax && value === data[filter.type][1] && filter.unboundedMax) {
        newValue = "No Max"
        customValue = true
      }
      if (data.noMin && value === data[filter.type][0] && filter.unboundedMin) {
        newValue = "No Min"
        customValue = true
      }
    }
    return customValue
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
    const payload = createPayload(filter.value, true, true)
    onChange(filter.attributeKey, filter.type, filter.value, payload)
  }, [])

  const calculateStep = () => {
    return filter.step || (filter.maxValue - filter.minValue) / 100
  }

  const useNonDebouncedValue = () => {
    return filter.type === 'rangeThreshold'
      ? data[filter.type][0] !== nonDebouncedValue[0] || data[filter.type][1] !== nonDebouncedValue[1]
      : data[filter.type] !== nonDebouncedValue
  }
  
  const onFilterChange = (value) => {
    // Check if max value is set or min value is set
    const newNoMin = !!(value[0] === filter.minValue && filter.unboundedMin)
    const newNoMax = !!(value[1] === filter.maxValue && filter.unboundedMax)
    const payload = createPayload(value, newNoMax, newNoMin)
    setNonDebouncedValue(value)
    debounceOnChange(filter.attributeKey, filter.type, value, payload)
  }

  const debounceOnChange = _.debounce(onChange, 250)

  return (
    <div>
      {data &&
        <Component
          min={filter.minValue}
          max={filter.maxValue}
          step={calculateStep()}
          label={(value) => createLabel(value || 0)}
          marks={filter.marks || marks}
          value={useNonDebouncedValue() ? nonDebouncedValue : data[filter.type]}
          onChange={(value) => {
            onFilterChange(value)
          }}
          labelAlwaysOn
          styles={{
            root: {
              marginTop: '1.5em',
              width: '95%',
              marginLeft: '5px'
            },
            label: {
              backgroundColor: '#228be6',
              color: '#fff'
            },
          }}
        />
      }
    </div>
  )
}

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = () => ({})

const AccordionThresholdComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionThreshold)
export default AccordionThresholdComponent