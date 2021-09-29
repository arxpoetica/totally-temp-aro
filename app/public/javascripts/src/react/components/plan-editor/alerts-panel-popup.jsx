import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorSelectors from './plan-editor-selectors'
import { OverlayView } from '../common/maps/OverlayView'
// import cx from 'clsx'

const _AlertsPanelPopup = ({ locationAlerts, alertTypes, cursorLocationIds, map }) => {

  // TODO: find these values...
  const position = new google.maps.LatLng(38.87837240377658, -76.94005246098406)

  // we don't render anything immediately
  return (
    <OverlayView position={position}>
      <div className="alerts-panel-popup" style={{ backgroundColor: 'gray', position: 'absolute' }}>
        Look at all this content
      </div>
    </OverlayView>
  )
}

const mapStateToProps = state => ({
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  alertTypes: PlanEditorSelectors.AlertTypes,
  cursorLocationIds: state.planEditor.cursorLocationIds,
  // TODO: why is this named `googleMaps`? Is it ever plural? Isn't it a single map?
  map: state.map.googleMaps,
})
const mapDispatchToProps = dispatch => ({})
export const AlertsPanelPopup = connect(mapStateToProps, mapDispatchToProps)(_AlertsPanelPopup)
