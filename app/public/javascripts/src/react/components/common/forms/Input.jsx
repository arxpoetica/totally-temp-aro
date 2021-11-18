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
  placeholder,
  onChange = () => {},
  onBlur = () => {},
}) => {

  const handleBlur = event => {
    const valueFloat = parseFloat(event.target.value)
    if (max && valueFloat > max ) {
      event.target.value = max
    } else if (min && valueFloat < min) {
      event.target.value = min
    }
    onBlur(event)
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
        onChange={event => onChange(event)}
        onBlur={event => handleBlur(event)}
        placeholder={placeholder}
      />
    </div>
  )
}
