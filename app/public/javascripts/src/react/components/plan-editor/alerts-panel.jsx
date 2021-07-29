import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors.js'
import cx from 'clsx'

const DefectsPanel = props => {

  const { locationAlerts, alertTypes } = props
  const alerts = Object.entries(locationAlerts)

  const [open, setOpen] = useState(false)
  const handleOpenState = () => setOpen(!open)

  return alerts.length ? (
    <div className={cx('alerts-panel', open && 'open')}>

      <div className="header" onClick={handleOpenState}>
        <span className="svg plus-minus"></span>
        <span className="svg warning"></span>
        <h2>Plan Defects <small>{alerts.length} item{alerts.length ? 's' : ''}</small></h2>
      </div>

      <ul className={cx('content', open && 'open')}>

        {alerts.map(([id, location]) => (
          location.alerts.map((alert, index) =>
            <li key={index}>
              <div className="text">
                <div
                  className="svg location"
                  style={ { backgroundImage: `url('${alertTypes[alert].iconUrl}')` } }
                ></div>
                {alertTypes[alert].displayName}
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
  locationAlerts: PlanEditorSelectors.getAlertsForSelectedSubnet(state),
  alertTypes: PlanEditorSelectors.AlertTypes,
})

const mapDispatchToProps = dispatch => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(DefectsPanel)
