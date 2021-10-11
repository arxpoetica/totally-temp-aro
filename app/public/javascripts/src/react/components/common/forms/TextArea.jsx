import React from 'react'
import cx from 'clsx'
import './TextArea.css'

export const TextArea = ({
  value,
  placeholder,
  disabled,
  classes,
  onChange = () => {},
}) => {
  return (
    <div className={cx('textarea', classes && classes)}>
      <textarea
        value={value}
        onChange={(event) => onChange(event)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  )
}
