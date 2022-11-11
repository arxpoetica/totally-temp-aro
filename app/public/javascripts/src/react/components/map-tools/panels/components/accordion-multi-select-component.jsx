
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { MultiSelect, CloseButton, Tooltip } from '@mantine/core';

const AccordionCheckbox = (props) => {
  const {
    filter,
    values,
    onChange,
    data
  } = props

  useEffect(() => {
    const defaultValues = []
    filter.values.forEach(value => {
      if(!value.selected) return
      defaultValues.push(value.value)
      delete value.selected
    })

    onChange(filter.attributeKey, filter.type, defaultValues)
  }, [])

  const onFilterChange = (value) => {
    onChange(filter.attributeKey, filter.type, value)
  }

  const truncate = (string) => {
    if (string.length < 16) return string

    return (
      <Tooltip
        label={string}
        withArrow
        multiline
        color='blue'
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
      value={data[filter.type]}
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

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = () => ({})

const AccordionCheckboxComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionCheckbox)
export default AccordionCheckboxComponent
