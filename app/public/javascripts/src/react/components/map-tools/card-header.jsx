import React, { useContext } from 'react'
import { MapToolContext } from './map-display-tools.jsx'

export const CardHeader = ({ mapToolName }) => {
  const { mapToolState: { collapsed }, globalMethods: { MapToolActions, isMapToolExpanded }, dispatch } = useContext(MapToolContext)

  const iconType = isMapToolExpanded(collapsed, mapToolName)
    ? 'fa fa-chevron-up'
    : 'fa fa-chevron-down'

  return (
    <div className='card-header bg-primary text-white'>
      <span
        className='float-right aro-pointer'
        onClick={() =>
          isMapToolExpanded(collapsed, mapToolName)
            ? dispatch({ type: MapToolActions.MAP_SET_COLLAPSE_MAP_TOOL, payload: mapToolName })
            : dispatch({ type: MapToolActions.MAP_SET_EXPAND_MAP_TOOL, payload: mapToolName })
        }
      >
        <i className={`dropdown-icon ${iconType}`} />
      </span>
      <h5 className="title-text">{mapToolName === "Cables" ? "Fibers" : mapToolName}</h5>
      <style jsx>
        {`
        .card-header {
          padding: 10px 20px;
        }
        
        .card-header .dropdown-icon {
          color: white;
        }
        
        .card-header .title-text{
          margin: 0px;
        }
        `}
      </style>
    </div>
  )
}
