import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import cx from 'clsx'
import PlanEditorSelectors from './plan-editor-selectors'
import { constants } from './shared'
const { ALERT_TYPES, Z_INDEX_PIN } = constants

const AlertsPanel = props => {

  const { locationAlerts, cursorLocationIds, map } = props
  const alerts = Object.entries(locationAlerts)

  const [open, setOpen] = useState(false)
  const [bounceMarker, setBounceMarker] = useState(null)
  const handleOpenState = () => setOpen(!open)

  const handleMouseEnter = ({ latitude, longitude }) => {
    const marker = new google.maps.Marker({
      map,
      icon: {
        url: '/svg/map-icons/pin.svg',
        size: new google.maps.Size(19, 30),
      },
      animation: google.maps.Animation.BOUNCE,
      position: { lat: latitude, lng: longitude },
      zIndex: Z_INDEX_PIN,
    })
    setBounceMarker(marker)
  }

  const handleMouseLeave = () => {
    bounceMarker.setMap(null)
    setBounceMarker(null)
  }

  const handleClick = ({ latitude, longitude }) => {
    map.setCenter({ lat: latitude, lng: longitude })
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
            <li
              key={index}
              onMouseEnter={() => handleMouseEnter(location.point)}
              onMouseLeave={() => handleMouseLeave()}
              onClick={() => handleClick(location.point)}
            >
              <div className="text">
                <div
                  className="svg location"
                  style={ { backgroundImage: `url('${ALERT_TYPES[alert].iconUrl}')` } }
                ></div>
                {ALERT_TYPES[alert].displayName}
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
  cursorLocationIds: state.planEditor.cursorLocationIds,
  // TODO: why is this named `googleMaps`? Is it ever plural? Isn't it a single map?
  map: state.map.googleMaps,
})

const mapDispatchToProps = dispatch => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(AlertsPanel)
