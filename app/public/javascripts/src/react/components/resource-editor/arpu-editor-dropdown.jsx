import React, { useState } from 'react'
import cx from 'clsx'
import { ClickOutside } from '../common/ClickOutside.jsx'
import { Input } from './../common/forms/Input.jsx'

export const Dropdown = ({ product, handler }) => {

  const [open, setOpen] = useState(false)
  const handleOpenState = () => setOpen(!open)

  const METRICS = Object.freeze([
    { title: 'ARPU', text: 'Avg. Revenue Per User', property: 'arpu' },
    { title: 'OPEX', text: 'Operating Expense', property: 'opex' },
    { title: 'Cost', text: 'Acquisition Cost', property: 'fixedCost' },
  ])

  return (
    <div className="arpu-dropdown">
      <button
        type="button"
        className="toggle"
        aria-label={open ? 'Close' : 'Open'}
        onClick={handleOpenState}
      >
        ${product.arpu} | ${product.opex} | ${product.fixedCost}
        <span className="svg">
          <svg viewBox="0 0 7 4">
            <path d="M.965 0h5.001a.4.4 0 01.283.683l-2.5
              2.501a.4.4 0 01-.566 0L.683.683A.4.4 0 01.965 0z"></path>
          </svg>
        </span>
      </button>
      <ClickOutside open={open} onClick={() => setOpen(!open)}>
        <div className={cx('dropdown', open && 'open')}>
          <ul>
            {METRICS.map((metric, index) =>
              <li key={index}>
                <h4>{metric.title}</h4>
                <p>{metric.text}</p>
                <Input
                  type="number"
                  classes="currency"
                  name={metric.property}
                  value={product[metric.property]}
                  onChange={event => handler(event)}
                />
              </li>
            )}
          </ul>
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={handleOpenState}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </ClickOutside>
    </div>
  )
}
