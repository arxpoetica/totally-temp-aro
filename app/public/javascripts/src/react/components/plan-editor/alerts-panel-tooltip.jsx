import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors'
import { MapTooltip } from '../common/maps/map-tooltip.jsx'
import { constants } from './shared'
const { ALERT_TYPES } = constants

const _AlertsPanelTooltip = props => {

  const { locationAlerts, cursorLocationIds, cursorEquipmentIds } = props
  const cursorIds = cursorLocationIds.concat(cursorEquipmentIds)
  const alerts = cursorIds
    .map(id => locationAlerts[id] && locationAlerts[id].alerts || [])
    .filter(alerts => alerts.length)

  let position
  if (cursorIds.length && locationAlerts[cursorIds[0]]) {
    // should only need to grab the first one because lat / lon should match all
    const { latitude, longitude } = locationAlerts[cursorIds[0]].point
    position = new google.maps.LatLng(latitude, longitude)
  }

  return (
    <MapTooltip show={alerts.length} position={position}>
      <ul>
        {alerts.map((type, index) => 
          <li key={`alert_${index}`}>{ALERT_TYPES[type].displayName}</li>
        )}
      </ul>
    </MapTooltip>
  )
}

const mapStateToProps = state => ({
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  cursorLocationIds: state.planEditor.cursorLocationIds,
  cursorEquipmentIds: state.planEditor.cursorEquipmentIds,
})
const mapDispatchToProps = dispatch => ({})
export const AlertsPanelTooltip = connect(mapStateToProps, mapDispatchToProps)(_AlertsPanelTooltip)
