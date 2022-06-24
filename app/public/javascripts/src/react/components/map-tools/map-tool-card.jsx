import React, { useRef, useEffect, useContext } from 'react'
import { MapToolContext } from './map-display-tools.jsx'

export const MapToolCard = (props) => {
  const { mapToolName, children } = props

  const { mapToolState: { visible, disabled }, globalMethods: { isMapToolVisible } } = useContext(MapToolContext)

  const mapToolBoxRef = useRef('')

  // Hacky! To animatedly hide the dialog box on closing, as when it appears
  useEffect(() => {
    if (mapToolBoxRef.current.className.includes('show')) {
      mapToolBoxRef.current.style.display = 'flex'
    }
    const mapToolOnAnimationEnd = () => {
      mapToolBoxRef.current.className.includes('hide')
        ? (mapToolBoxRef.current.style.display = 'none')
        : (mapToolBoxRef.current.style.display = 'flex')
    }
    if (mapToolBoxRef && mapToolBoxRef.current) {
      mapToolBoxRef.current.addEventListener('animationend', mapToolOnAnimationEnd)
    }

    return () => {
      mapToolBoxRef.current.removeEventListener('animationend', mapToolOnAnimationEnd)
    }
  }, [mapToolBoxRef, visible.join()])

  return (
    <div
      ref={mapToolBoxRef}
      className={`map-tool-wrapper ${
        isMapToolVisible(visible, disabled, mapToolName) ? 'show' : 'hide'
      }`}
    >
      <div className="card">
        {children}
      </div>
      <style jsx>
        {`
        .map-tool-wrapper {
          position: absolute;
          top: 75px;
          left: 85px;
          z-index: 1;
        }
        .card.card {
          border: 2px solid #eee;
          width: 360px;
          margin-top: 8%;
        }
        `}
      </style>
    </div>
  )
}
