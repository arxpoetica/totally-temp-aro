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
            <span className={cx('svg', anyRowIsOpen && 'open')}></span>
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
          <span className={cx('svg', open && 'open')}></span>
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
