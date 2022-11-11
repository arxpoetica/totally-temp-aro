import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Checkbox } from '@mantine/core';

const AccordionCheckbox = (props) => {
  const {
    filter,
    values,
    data,
    onChange
  } = props

  useEffect(() => {
    const defaultValues = []
    filter.values.forEach(value => {
      value.checked && value.shown &&
        defaultValues.push('value' in value ? value.value.toString() : value.key)
    })

    onChange(filter.attributeKey, filter.type, defaultValues)
  }, [])

  const onFilterChange = (value) => {
    onChange(filter.attributeKey, filter.type, value)
  }

  return (
    <>
      {data &&
        <Checkbox.Group
          value={data[filter.type]}
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
      }
    </>
  )
}
const mapStateToProps = () => {
  return {}
}

const mapDispatchToProps = () => ({})

const AccordionCheckboxComponent = connect(mapStateToProps, mapDispatchToProps)(AccordionCheckbox)
export default AccordionCheckboxComponent
