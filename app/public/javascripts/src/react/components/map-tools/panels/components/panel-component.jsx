import React, { useState, useContext } from 'react'
import { connect } from 'react-redux'
import { CardBody } from '../../card-body.jsx'
import { CardHeader } from '../../card-header.jsx'
import { MapToolContext } from "../../map-display-tools.jsx"
import MapTool from '../../map-tool.jsx'
import { MapToolCard } from '../../map-tool-card.jsx'
import { MapToolIcon } from '../../map-tool-icon.jsx'

const Panel = (props) => {
  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)
  const { visible, disabled, collapsed } = mapToolState
  const { MapToolActions, isMapToolExpanded, isMapToolVisible } = globalMethods

  const {
    panelKey,
    panelLabel
  } = props

  return (
    <MapTool className="location">
      <MapToolIcon
        handleClick={() =>
          dispatch({
            type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL,
            payload: panelKey
          })
        }
        toolId={panelKey}
        active={isMapToolVisible(visible, disabled, panelKey)}
      />
      <div className="location-maptool-card">
        <MapToolCard mapToolName={panelKey}>
          <CardHeader mapToolName={panelLabel} />
          <CardBody showCardBody={isMapToolExpanded(collapsed, panelKey)} padding="0">
            {props.children}
          </CardBody>
        </MapToolCard>
      </div>
      <style jsx>{`
      `}</style>
    </MapTool>
  )
}

const mapStateToProps = () => {
  return {
    
  }
}

const PanelComponent = connect(mapStateToProps, {})(Panel)
export default PanelComponent
