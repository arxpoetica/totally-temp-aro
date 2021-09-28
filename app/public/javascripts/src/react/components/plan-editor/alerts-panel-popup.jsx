import React, { useState, useEffect, ReactDOM } from 'react'
import { connect } from 'react-redux'
import { OverlayView } from '../common/maps/overlay-view'
// import cx from 'clsx'

let popup

const AlertsPanelPopup = ({ locationAlerts, alertTypes, cursorLocationIds, map }) => {

  useEffect(() => {
    popup = new OverlayView({
      position: new google.maps.LatLng(
        // TODO: find these values...
        38.87837240377658,
        -76.94005246098406,
      ),
      // content: document.getElementById('content'),
      content: document.getElementById('map-canvas'),
    })
    popup.setMap()

    return () => delete popup
  }, [])

  // we don't render anything immediately
  return null
}

const mapStateToProps = state => ({
  locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  alertTypes: PlanEditorSelectors.AlertTypes,
  cursorLocationIds: state.planEditor.cursorLocationIds,
  // TODO: why is this named `googleMaps`? Is it ever plural? Isn't it a single map?
  map: state.map.googleMaps,
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(AlertsPanelPopup)
