import React, { useState } from 'react'
import cx from 'clsx'
import './Select.css'

export const Select = ({ options, value, placeholder, classes, onClick=()=>{}, onChange=()=>{} }) => {

  return (
    <div className={cx('select', classes && classes)}>
      <select
        value={value}
        onClick={event => onClick(event)}
        onChange={event => onChange(event)}
        
      >
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {options.map(({ label, value }) => 
          <option key={value} value={value}>{label}</option>
        )}
      </select>
      <span className="svg">
        <svg viewBox="0 0 7 4">
          <path d="M.965 0h5.001a.4.4 0 01.283.683l-2.5
            2.501a.4.4 0 01-.566 0L.683.683A.4.4 0 01.965 0z"></path>
        </svg>
      </span>
    </div>
  )
}
