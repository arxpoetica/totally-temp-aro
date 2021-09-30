import React from 'react'
import { OverlayView } from './overlay-view'
// import cx from 'clsx'
import './map-tooltip.css'

export const MapTooltip = ({ show = false, position, children }) => {
  return position && show ? (
    <OverlayView position={position}>
      <div className="map-tooltip">
        <div className="content">
          {children}
        </div>
      </div>
    </OverlayView>
  ) : null
}
