import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors.js'
import cx from 'clsx'

const DefectsPanel = props => {

  const { locationAlerts, alertTypes, map, locations } = props
  const alerts = Object.entries(locationAlerts)

  const [open, setOpen] = useState(false)
  const handleOpenState = () => setOpen(!open)

  const handleClick = ({ locationId }) => {
    const location = locations[locationId]
    if (location) {
      const { latitude, longitude } = location.point
      map.setCenter({ lat: latitude, lng: longitude })
    }
  }

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
            <li key={index} onClick={() => handleClick(location)}>
              <div className="text">
                <div
                  className="svg location"
                  style={ { backgroundImage: `url('${alertTypes[alert].iconUrl}')` } }
                ></div>
                {alertTypes[alert].displayName}
              </div>
            </li>
          )
        ))}
      </ul>

    </div>
  ) : null

}

const mapStateToProps = state => ({
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  alertTypes: PlanEditorSelectors.AlertTypes,
  // TODO: why is this named `googleMaps`? Is it ever plural? Isn't it a single map?
  map: state.map.googleMaps,
  locations: PlanEditorSelectors.getSelectedSubnetLocations(state),
})

const mapDispatchToProps = dispatch => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(DefectsPanel)
