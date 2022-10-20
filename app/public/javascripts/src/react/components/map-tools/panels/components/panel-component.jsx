import React, { useState, useContext } from 'react'
import { connect } from 'react-redux'
import { Accordion } from '@mantine/core';
import { IconPlus } from '@tabler/icons';
import AccordionComponent from './accordion-component.jsx';
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
  const [expandedAccords, setExpandedAccords] = useState(['resourceEntityTypes'])

  const {
    configuration,
    panelKey,
    panelLabel,
    resourceEntityTypes
  } = props

  const orderedFilters = () => {
    if (!configuration.ui.perspective.mapTools) return []

    const configurationFilters = configuration.ui.perspective.mapTools.toolDetails[panelKey].filters
    return [
      ...configurationFilters.filter(filter => filter.top),
      { 
        label: `${panelLabel.replace(/[s]$/, "")} Types`,
        attributeKey: 'resourceEntityTypes',
        type: 'multiSelect',
        values: resourceEntityTypes.map(entity => {
          entity.shown = true
          return entity
        })
      },
      ...configurationFilters.filter(filter => !filter.top)
    ]
  }

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
            <Accordion
              multiple
              value={expandedAccords}
              onChange={setExpandedAccords}
              chevron={<IconPlus size={16} />}
              styles={{
                control: {
                  backgroundColor: "#dddddd",
                  padding: '8px 8px',
                  ':hover': {
                    backgroundColor: "#dddddd"
                  }
                },
                chevron: {
                  backgroundColor: "white",
                  height: "1.5em",
                  width: "1.5em",
                  borderRadius: "5px",
                },
                content: {
                  paddingTop: '16px'
                }
              }}
            >
              {orderedFilters().map(oFilter => {
                return (
                  <div key={oFilter.attributeKey} style={{ paddingBottom: '1px' }}>
                    <AccordionComponent 
                      filter={oFilter}
                      isExpanded={expandedAccords.includes(oFilter.attributeKey)}
                      layer={panelKey}
                    />
                  </div>
                )
              })}
            </Accordion>
          </CardBody>
        </MapToolCard>
      </div>
      <style jsx>{`
      `}</style>
    </MapTool>
  )
}

const mapStateToProps = (state) => {
  return {
    configuration: state.configuration,
  }
}

const PanelComponent = connect(mapStateToProps, {})(Panel)
export default PanelComponent
