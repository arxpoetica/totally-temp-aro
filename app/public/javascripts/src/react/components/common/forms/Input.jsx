import React from 'react'
import cx from 'clsx'
import './Input.css'

export const Input = ({
  type = 'text',
  value = '',
  name,
  min,
  max,
  classes,
  disabled,
  onChange = () => {},
}) => {

  const handleChange = (event) => {
    console.log("before", event.target.value)
    const valueFloat = parseFloat(event.target.value)
    if (max && valueFloat > max ) {
      event.target.value = max
      console.log('more', event.target.value)
    } else if (min && valueFloat < min) {
      event.target.value = min
      console.log("less", event.target.value)
    }
    console.log("after", event.target.value)
    onChange(event)
  }
  return (
    <div className={cx('aro-input', classes && classes)}>
      <input
        type={type}
        name={name}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={event => handleChange(event)}
      />
    </div>
  )
}
