import React from 'react'
import cx from 'clsx'
import './Input.css'

export const FileInput = ({
  name,
  accept,
  classes,
  disabled,
  onChange = () => {},
}) => {

  return (
    <div className={cx('aro-file-input', classes && classes)}>
      <input
        type='file'
        name={name}
        accept={accept}
        disabled={disabled}
        onChange={event => onChange(event)}
      />
    </div>
  )
}
