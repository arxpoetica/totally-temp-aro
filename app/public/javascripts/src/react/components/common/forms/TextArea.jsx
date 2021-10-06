import React from 'react'
import cx from 'clsx'
import './TextArea.css'

export const TextArea = ({ value, placeholder, disabled, classes, onChange=()=>{} }) => {

  return (
    <div className={cx('text-area', classes && classes)}>
      <textarea
        value={value}
        onChange={event => onChange(event)}
        disabled={disabled}
      >
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
      </textarea>
    </div>
  )
}
