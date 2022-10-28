import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Radio } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionRadio = (props) => {
  const {
    filter,
    values,
    updateMapLayerFilters,
    layer
  } = props
  const [radioValue, setRadioValue] = useState(values[0].key);
  
  useEffect(() => {
    updateMapLayerFilters(layer, filter.attributeKey, { singleSelect: radioValue })
  }, [])

  const onFilterChange = (value) => {
    setRadioValue(value)
    updateMapLayerFilters(layer, filter.attributeKey, { singleSelect: value })
  }

  return (
    <Radio.Group
      classNames={{ root: 'group-root' }}
      value={radioValue}
      onChange={(value) => onFilterChange(value)}
    >
      {values.filter(value => value.shown).map(value => {
        return (
          <div key={value.key} style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', flexDirection: 'row' }}>
              <div className="ctype-name">{value.label}</div>
            </span>
            <Radio value={value.key} />
          </div>
        )
      })}
    <style jsx>{`
      {/* This is necessary to access a hidden class in mantine
      that was causing issues */}
      :global(.group-root) > :global(*) {
        gap: 5px !important;
        padding-top: 0px !important;
      }
    `}</style>
    </Radio.Group>
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

const AccordionRadioComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionRadio)
export default AccordionRadioComponent