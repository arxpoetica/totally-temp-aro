import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Checkbox } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionCheckbox = (props) => {
  const {
    filter,
    values,
    updateMapLayerFilters,
    filters,
    layer
  } = props
  const [checkboxValues, setCheckboxValues] = useState([])

  useEffect(() => {
    const defaultValues = []
    filter.values.forEach(value => {
      value.checked && value.shown &&
        defaultValues.push('value' in value ? value.value.toString() : value.key)
    })

    updateMapLayerFilters(layer, filter.attributeKey, { multiSelect: defaultValues })
    setCheckboxValues(defaultValues)
  }, [])

  const onFilterChange = (value) => {
    setCheckboxValues(value)
    updateMapLayerFilters(layer, filter.attributeKey, { multiSelect: value })
  }

  useEffect(() => {
    console.log(filters[layer][filter.attributeKey].multiSelect)
    if (filters[layer][filter.attributeKey].multiSelect !== checkboxValues) {
      setCheckboxValues(filters[layer][filter.attributeKey].multiSelect)
    }
  }, [filters])

  return (
    <Checkbox.Group
      value={checkboxValues}
      onChange={(value) => onFilterChange(value)}
      classNames={{ root: 'group-root' }}
    >
      {values.filter(value => value.shown).map(value => {
        return (
            <div key={value.key} style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingBottom: '.5em' }}>
              <span style={{ display: 'flex', flexDirection: 'row' }}>
                {value.iconUrl && (
                  <div className="ctype-icon" style={{ paddingRight: '.5em' }}>
                    <img className="image" src={value.iconUrl} alt="location-icon" />
                  </div>
                )}
                <div className="ctype-name">{value.label}</div>
              </span>
              <Checkbox
                value={'value' in value ? value.value.toString() : value.key}
              />
            </div>
        )
      })}
      <style jsx>{`
        {/* This is necessary to access a hidden class in mantine
        that was causing issues */}
        :global(.group-root) > :global(*) {
          gap: 0px !important;
          padding-top: 0px !important;
        }
    `}</style>
    </Checkbox.Group>
  )
}

const mapStateToProps = (state) => {
  return {
    filters: state.mapLayers.filters
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateMapLayerFilters: (layer, key, value) => dispatch(MapLayerActions.updateMapLayerFilters(layer, key, value)),
})

const AccordionCheckboxComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionCheckbox)
export default AccordionCheckboxComponent
