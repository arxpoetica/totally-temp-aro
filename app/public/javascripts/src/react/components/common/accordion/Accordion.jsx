import React, { useState, useContext } from 'react'
import cx from 'clsx'
import './accordion.css'

const AccordionContext = React.createContext()

// = = = = = = = = = = = = = = = = = = = = >>>
// = = = = = = = = = = = = = = = = = = = = >>> ACCORDION
// = = = = = = = = = = = = = = = = = = = = >>>

export const Accordion = ({ children, items }) => {

  const [rowsOpen, setRowsOpen] = useState(items.map(() => false))
  // this confusing double negative just checks to see if ANY row is open
  const anyRowIsOpen = !rowsOpen.every(open => !open)
  const handleOpenState = () => setRowsOpen(items.map(() => !anyRowIsOpen))

  return (
    <AccordionContext.Provider value={{ rowsOpen, setRowsOpen }}>
      <div className="accordion">
        <div className="accordion-tools" onClick={handleOpenState}>
          <h2 className="title">
            {anyRowIsOpen ? <ToggleMinus/> : <TogglePlus/>}
            {anyRowIsOpen ? 'close' : 'expand'} all
          </h2>
        </div>
        <ul className="accordion-list">
          {children}
        </ul>
      </div>
    </AccordionContext.Provider>
  )
}

// = = = = = = = = = = = = = = = = = = = = >>>
// = = = = = = = = = = = = = = = = = = = = >>> TOGGLE
// = = = = = = = = = = = = = = = = = = = = >>>

// export const AccordionToggle = ({ children, items }) => {
// }

// = = = = = = = = = = = = = = = = = = = = >>>
// = = = = = = = = = = = = = = = = = = = = >>> ROW
// = = = = = = = = = = = = = = = = = = = = >>>

export const AccordionRow = ({ children, index, title, header }) => {

  const { rowsOpen, setRowsOpen } = useContext(AccordionContext)

  const open = rowsOpen[index]
  const handleOpenState = () => setRowsOpen(
    rowsOpen.map((open, oIndex) => oIndex === index ? !open : open)
  )

  return (
    <li className={cx('accordion-row', open && 'open')}>

      {/* = = = = = = = = = = = = = = = = = = = = >>> HEADER */}

      <div className="accordion-header" onClick={handleOpenState}>
        
        <h2 className="title">
          <div className="svg">
            {open ? <ToggleMinus/> : <TogglePlus/>}
          </div>
          {title}
        </h2>
        {/* RENDERS JSX */}
        {header && <div className="header-content">{header}</div>}
      </div>

      {/* = = = = = = = = = = = = = = = = = = = = >>> CONTENT */}

      <div className={cx('accordion-content', open && 'open')}>
        {children}
      </div>

    </li>
  )
}

// = = = = = = = = = = = = = = = = = = = = >>>
// = = = = = = = = = = = = = = = = = = = = >>> SVG
// = = = = = = = = = = = = = = = = = = = = >>>

function TogglePlus () {
  return (
    <div className="svg">
      <svg viewBox="0 0 16 16">
        <path d="M12 0a4 4 0 014 4v8a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0
          014-4h8zm0 1H4a3 3 0 00-2.995 2.824L1 4v8a3 3 0 002.824 2.995L4
          15h8a3 3 0 002.995-2.824L15 12V4a3 3 0 00-3-3zM9
          4v3h3v2H9v3H7V9H4V7h3V4h2z"
          fill="none" fillRule="evenodd"
        />
      </svg>
    </div>
  )
}

function ToggleMinus () {
  return (
    <div className="svg">
      <svg viewBox="0 0 16 16">
        <path d="M12 0a4 4 0 014 4v8a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0
          014-4h8zm0 1H4a3 3 0 00-2.995 2.824L1 4v8a3 3 0 002.824 2.995L4
          15h8a3 3 0 002.995-2.824L15 12V4a3 3 0 00-3-3zm0 6v2H4V7h8z"
          fill="none" fillRule="evenodd"
        />
      </svg>
    </div>
  )
}