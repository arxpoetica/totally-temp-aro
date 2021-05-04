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
  onChange = () => {},
}) => {
  return (
    <div className={cx('aro-input', classes && classes)}>
      <input
        type={type}
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={event => onChange(event)}
      />
    </div>
  )
}