import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Radio } from '@mantine/core';

const AccordionRadio = (props) => {
  const {
    filter,
    values,
    onChange,
    data
  } = props  
  useEffect(() => {
    onChange(filter.attributeKey, filter.type, values[0].key)
  }, [])

  const onFilterChange = (value) => {
    onChange(filter.attributeKey, filter.type, value)
  }

  return (
    <Radio.Group
      classNames={{ root: 'group-root' }}
      value={data[filter.type]}
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

const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = () => ({})

const AccordionRadioComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionRadio)
export default AccordionRadioComponent