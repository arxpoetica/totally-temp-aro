import React from 'react'

const MapTool = (props) => {
  // using "className" prop in case for component specific css
  const { className, children } = props

  return <div className={`react-map-tool ${className}`}>{children}</div>
}

export default MapTool
