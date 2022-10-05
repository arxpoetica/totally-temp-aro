import React, { useState, useContext } from 'react'
import { Accordion } from '@mantine/core';
import { MapToolContext } from "../map-display-tools.jsx"
import { connect } from 'react-redux'
import MapLayerActions from '../../map-layers/map-layer-actions'
import reduxStore from '../../../../redux-store'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { CardBody } from '../card-body.jsx'
import MapTool from '../map-tool.jsx'

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

  const hasFilters = () => {
    return configuration.ui.perspective.mapTools 
      && configuration.ui.perspective.mapTools.toolDetails[panelKey].filters.length > 0
  }

  const getConfigurationFilters = () => {
    if (hasFilters()) {
      return configuration.ui.perspective.mapTools.toolDetails[panelKey].filters
    }

    return []
  }

  const getTopFilters = () => {
    return getConfigurationFilters().filter(filter => {
      return filter.top
    })
  }

  return (
    <MapTool className="location">
      <MapToolIcon
        handleClick={() =>
          dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: panelKey })
        }
        toolId={panelKey}
        active={isMapToolVisible(visible, disabled, panelKey)}
      />
      <div className="location-maptool-card">
        <MapToolCard mapToolName={panelKey}>
          <CardHeader mapToolName={panelLabel} />

          <CardBody showCardBody={isMapToolExpanded(collapsed, panelKey)}>
            <Accordion multiple value={expandedAccords} onChange={setExpandedAccords}>
              {getTopFilters().length > 0 && getTopFilters().map(topFilter => (
                <Accordion.Item value="global-filters">
                  <Accordion.Control>{topFilter.label}</Accordion.Control>
                  <Accordion.Panel>
                  {/* <PanelFilterComponent filter={topFilter} panelKey={panelKey} /> */}
                  <div style={{ paddingBottom: '1em' }}>
                    {topFilter.values.map(value => {
                      return (
                        <div key={value.key} style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                          <div className="ctype-name">{value.label}</div>
                          <input
                            type="checkbox"
                            className="checkboxfill"
                          />
                        </div>
                      )
                    })}
                  </div>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}

              <Accordion.Item value="resourceEntityTypes">
                <Accordion.Control>{panelLabel.replace(/[s]$/, "")} Types</Accordion.Control>
                <Accordion.Panel>
                  <form>
                    <ul className="customer-type">
                      {resourceEntityTypes &&
                        resourceEntityTypes.map((resourceEntityType, index) => {
                          return (
                            resourceEntityType.show && (
                              <li key={index}>
                                {resourceEntityType.showIcon && (
                                  <div className="ctype-icon">
                                    <img className="image" src={resourceEntityType.iconUrl} alt="location-icon" />
                                  </div>
                                )}

                                <div className="ctype-name">{resourceEntityType.label}</div>
                                <div className="ctype-checkbox">
                                  <input
                                    type="checkbox"
                                    className="checkboxfill"
                                  />
                                </div>
                              </li>
                            )
                          )
                        })}
                    </ul>
                  </form>
                </Accordion.Panel>
              </Accordion.Item>
              {getConfigurationFilters().filter(filter => !filter.top).map((filter) => {
                return (
                  <Accordion.Item value={filter.attributeKey} key={filter.attributeKey}>
                    <Accordion.Control>
                      {filter.label}
                    </Accordion.Control>
                    <Accordion.Panel>
                      <div>
                        {filter.type === 'threshold' ? (
                          <div className="row range-input">
                            {filter.value.toFixed(2)}
                            <input
                              type="range"
                              min={filter.minValue}
                              max={filter.maxValue}
                              step={(filter.maxValue - filter.minValue) / 100}
                            />
                          </div>
                        ) : (
                          <div style={{ paddingBottom: '1em' }}>
                            {filter.values.map(value => {
                              return (
                                <div key={value.key} style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                                  <div className="ctype-name">{value.label}</div>
                                  <input
                                    type="checkbox"
                                    className="checkboxfill"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </Accordion.Panel>
                  </Accordion.Item>
                )
              })}
            </Accordion>
          </CardBody>
        </MapToolCard>
      </div>
      <style jsx>{`
        .title {
          margin-top: -12px;
          padding: 5px 10px;
          background-color: #ddd;
          font-weight: bold;
        }
        .title .btn {
          padding: 3px 5px 0px 5px;
        }
        .title .label {
          line-height: 26px;
          margin-left: 5px;
        }
        .column {
          padding: 5px 15px;
        }
        .layer-type-checkboxes {
          margin-top: 0px;
        }
        .range-input {
          padding: 15px;
        }
        .image {
          width: 16px;
          margin-right: 10px;
        }
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
