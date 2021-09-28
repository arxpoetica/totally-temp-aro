import React, { useState, useEffect } from 'react'

/**
 * A customized `OverlayView` on the map
 * SEE: https://dev.to/rihdusr/render-a-react-component-in-google-map-171o
 */
export class OverlayView extends google.maps.OverlayView {
  position = null
  content = null
  constructor(props) {
    super(props)
    props.position && (this.position = props.position)
    props.content && (this.content = props.content)
  }
  // called when the popup is added to the map
  onAdd() {
    this.getPanes().floatPane.appendChild(this.content)
  }
  // called when the popup is removed from the map
  onRemove() {
    if (this.content.parentElement) {
        this.content.parentElement.removeChild(this.content)
    }
  }
  // called each frame when the popup needs to draw itself
  draw() {
    const { x, y } = this.getProjection().fromLatLngToDivPixel(this.position)
    this.content.style.left = x + 'px'
    this.content.style.top = y + 'px'
  }
}

export const OverlayViewContainer = ({ position, children }) => {
   // overlay instance
   let overlay = null
   // dom element reference to the content rendered in the overlay
   let el = null

   useEffect(() => {
      // remove overlay from the map
      return () => {
         if (overlay) {
            overlay.setMap(null)
            overlay = null
         }
      }
   }, [])

   return (
      <MapContext.Consumer>
         {map => {
            if (map) {
               el = el || createOverlayElement()
               overlay = overlay || new OverlayView({ position, content: el })
               overlay.setMap(map)

               return ReactDOM.createPortal(children, el)
            } else {
               return null
            }
         }}
      </MapContext.Consumer>
   )
}
