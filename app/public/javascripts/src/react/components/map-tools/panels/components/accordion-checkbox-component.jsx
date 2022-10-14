import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Checkbox } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionCheckbox = (props) => {
  const {
    filter,
    values,
    updateMapLayerFilters
  } = props
  const [checkboxValues, setCheckboxValues] = useState([])

  useEffect(() => {
    if (values[0] && values[0].key) {
      setCheckboxValues([values[0].key])
      updateMapLayerFilters('near_net', filter.attributeKey, { multiSelect: [values[0].key] })
    }
  }, [])

  const onFilterChange = (value) => {
    setCheckboxValues(value)
    // Async issue where the value isn't added to state before we call action
    updateMapLayerFilters('near_net', filter.attributeKey, { multiSelect: checkboxValues.concat(value) })
  }


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
                {value.showIcon && (
                  <div className="ctype-icon" style={{ paddingRight: '.5em' }}>
                    <img className="image" src={value.iconUrl} alt="location-icon" />
                  </div>
                )}
                <div className="ctype-name">{value.label}</div>
              </span>
              <Checkbox
                value={value.key}
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
    nearNetFilters: state.mapLayers.filters.near_net
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateMapLayerFilters: (layer, key, value) => dispatch(MapLayerActions.updateMapLayerFilters(layer, key, value)),
})

const AccordionCheckboxComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionCheckbox)
export default AccordionCheckboxComponent
