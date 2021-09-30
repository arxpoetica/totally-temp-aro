import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors'
import { MapTooltip } from '../common/maps/map-tooltip'
import { constants } from './constants'
const { ALERT_TYPES } = constants

const _AlertsPanelTooltip = props => {

  const { cursorLocationIds, locationAlerts } = props
  const alerts = cursorLocationIds
    .map(id => locationAlerts[id] && locationAlerts[id].alerts || [])
    .filter(alerts => alerts.length)

  let position
  if (cursorLocationIds.length && locationAlerts[cursorLocationIds[0]]) {
    // should only need to grab the first one because lat / lon should match all
    const { latitude, longitude } = locationAlerts[cursorLocationIds[0]].point
    position = new google.maps.LatLng(latitude, longitude)
  }

  return (
    <MapTooltip show={alerts.length} position={position}>
      {alerts.map(type => ALERT_TYPES[type].displayName).join(', ')}
    </MapTooltip>
  )
}

const mapStateToProps = state => ({
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  cursorLocationIds: state.planEditor.cursorLocationIds,
})
const mapDispatchToProps = dispatch => ({})
export const AlertsPanelTooltip = connect(mapStateToProps, mapDispatchToProps)(_AlertsPanelTooltip)
