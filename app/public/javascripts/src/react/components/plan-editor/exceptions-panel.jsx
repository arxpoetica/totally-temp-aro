import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors.js'
import cx from 'clsx'

const DefectsPanel = props => {

  const { locationExceptions, exceptionTypes } = props
  const exceptions = Object.entries(locationExceptions)

  const [open, setOpen] = useState(false)
  const handleOpenState = () => setOpen(!open)

  return exceptions.length ? (
    <div className={cx('exceptions-panel', open && 'open')}>

      <div className="header" onClick={handleOpenState}>
        <span className="svg plus-minus"></span>
        <span className="svg warning"></span>
        <h2>Plan Defects <small>{exceptions.length} item{exceptions.length ? 's' : ''}</small></h2>
      </div>

      <ul className={cx('content', open && 'open')}>

        {exceptions.map(([id, location]) => (
          location.exceptions.map((exception, index) =>
            <li key={index}>
              <div className="text">
                <div
                  className="svg location"
                  style={ { backgroundImage: `url('${exceptionTypes[exception].iconUrl}')` } }
                ></div>
                {exceptionTypes[exception].displayName}
              </div>
              {/* <div className="dropdown">
                <div className="svg caret"></div>
                <ul className="list">
                  <li>Ignore this Error</li>
                </ul>
              </div> */}
            </li>
          )
        ))}

      </ul>

    </div>
  ) : null

}

const mapStateToProps = state => ({
  locationExceptions: PlanEditorSelectors.getExceptionsForSelectedSubnet(state),
  exceptionTypes: PlanEditorSelectors.ExceptionTypes,
})

const mapDispatchToProps = dispatch => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(DefectsPanel)
