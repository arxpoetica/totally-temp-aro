
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { MultiSelect, CloseButton, Tooltip } from '@mantine/core';
import MapLayerActions from '../../../map-layers/map-layer-actions'

const AccordionCheckbox = (props) => {
  const {
    filter,
    values,
    updateMapLayerFilters,
    filters,
    layer
  } = props
  const [multiSelectValues, setMultiSelectValues] = useState([])

  useEffect(() => {
    const defaultValues = []
    filter.values.forEach(value => {
      if(!value.selected) return
      defaultValues.push(value.value)
      delete value.selected
    })

    updateMapLayerFilters(layer, filter.attributeKey, { multiSelect: defaultValues })
    setMultiSelectValues(defaultValues)
  }, [])

  const onFilterChange = (value) => {
    setMultiSelectValues(value)
    updateMapLayerFilters(layer, filter.attributeKey, { multiSelect: value })
  }

  useEffect(() => {
    if (filters[layer][filter.attributeKey].multiSelect !== multiSelectValues) {
      setMultiSelectValues(filters[layer][filter.attributeKey].multiSelect)
    }
  }, [filters])

  const truncate = (string) => {
    if (string.length < 16) return string

    return (
      <Tooltip
        label={string}
        withArrow
        multiline
      >
        <span>{string.slice(0, 15).concat("...")}</span>
      </Tooltip>
    )
  }

const MultiSelectValue = ({
  value,
  label,
  onRemove,
  classNames,
  ...others
}) => {
  return (
    <div {...others}>
      <div
        style={{
          display: 'flex',
          cursor: 'default',
          alignItems: 'center',
          backgroundColor: '#fff',
          border: 'grey',
          paddingLeft: 10,
          borderRadius: 4,
        }}
      >
        <div style={{ lineHeight: 1, fontSize: 12 }}>{truncate(label)}</div>
        <CloseButton
          onMouseDown={onRemove}
          variant="transparent"
          size={22}
          iconSize={14}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

  return (
    <MultiSelect
      value={multiSelectValues}
      data={values}
      onChange={(value) => onFilterChange(value)}
      classNames={{ root: 'group-root' }}
      valueComponent={MultiSelectValue}
      maxDropdownHeight={100}
      placeholder="Please Select Industries to Filter By..."
      nothingFound="All Industries Selected"
    />
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
