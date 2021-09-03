import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors.js'
import cx from 'clsx'

const DefectsPanel = props => {

  const { locationAlerts, alertTypes, map, locations } = props
  const alerts = Object.entries(locationAlerts)

  const [open, setOpen] = useState(false)
  const [bounceMarker, setBounceMarker] = useState(null)
  const handleOpenState = () => setOpen(!open)

  const handleMouseEnter = ({ locationId }) => {
    const { latitude, longitude } = locations[locationId].point
    const marker = new google.maps.Marker({
      map,
      icon: {
        url: '/svg/map-icons/pin.svg',
        size: new google.maps.Size(19, 30),
      },
      animation: google.maps.Animation.BOUNCE,
      position: { lat: latitude, lng: longitude },
    })
    setBounceMarker(marker)
  }

  const handleMouseLeave = ({ locationId }) => {
    bounceMarker.setMap(null)
    setBounceMarker(null)
  }

  const handleClick = ({ locationId }) => {
    const { latitude, longitude } = locations[locationId].point
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
              onMouseEnter={() => handleMouseEnter(location)}
              onMouseLeave={() => handleMouseLeave(location)}
              onClick={() => handleClick(location)}
            >
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
