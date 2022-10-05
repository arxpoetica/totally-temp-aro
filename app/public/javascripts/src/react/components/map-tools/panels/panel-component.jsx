import React, { useEffect, useState, useContext } from 'react'
import { Accordion } from '@mantine/core';
import { MapToolContext } from "../map-display-tools.jsx"
import { createSelector } from 'reselect'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RxState from '../../../common/rxState'
import MapLayerActions from '../../map-layers/map-layer-actions'
import reduxStore from '../../../../redux-store'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { CardBody } from '../card-body.jsx'
import MapTool from '../map-tool.jsx'
import { klona } from 'klona'
import { dequal } from 'dequal'

// // We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = (state) => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())
const getAllLocationFilters = (state) => state.mapLayers.locationFilters || {}
const getOrderedLocationFilters = createSelector([getAllLocationFilters], (locationFilters) => {
  const orderedLocationFilters = klona(locationFilters)
  Object.keys(orderedLocationFilters).forEach((filterType) => {
    const orderedRules = Object.keys(orderedLocationFilters[filterType].rules)
      .map((ruleKey) => ({
        ...orderedLocationFilters[filterType].rules[ruleKey],
        ruleKey,
      }))
      .sort((a, b) => (a.listIndex > b.listIndex ? 1 : -1))
    orderedLocationFilters[filterType].rules = orderedRules
  })
  return orderedLocationFilters
})

const locationLayerState = {
  createdMapLayerKeys: new Set(),
  disablelocations: false,
  measuredDistance: null,
}

export const NearNetPanel = (props) => {
  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)
  const { visible, disabled, collapsed } = mapToolState
  const { MapToolActions, isMapToolExpanded, isMapToolVisible } = globalMethods
  const [expandedAccords, setExpandedAccords] = useState(['checkboxes'])

  const {
    locationLayers,
    configuration,
    panelKey,
    panelLabel
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
                  <PanelFilterComponent filter={topFilter} panelKey={panelKey} />
                </Accordion.Item>
              ))}

              <Accordion.Item value="checkboxes">
                <Accordion.Control>Location Types</Accordion.Control>
                <Accordion.Panel>
                  <form>
                    <ul className="customer-type">
                      {/* <!-- Loop through all location types --> */}
                      {locationLayers &&
                        locationLayers.map((locationType, index) => {
                          return (
                            locationType.show && (
                              <li key={index}>
                                {locationType.showIcon && (
                                  <div className="ctype-icon">
                                    <img className="image" src={locationType.iconUrl} alt="location-icon" />
                                  </div>
                                )}

                                <div className="ctype-name">{locationType.label}</div>
                                <div className="ctype-checkbox">
                                  <input
                                    type="checkbox"
                                    className="checkboxfill"
                                    // checked={locationType.checked || false}
                                    // onChange={() =>
                                    //   updateLayerVisibility(locationType, !locationType.checked)
                                    // }
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
              {/* <!-- Markup for any location filters that are specified for the current perspective --> */}
              {hasFilters() && configuration.ui.perspective.mapTools.toolDetails.near_net.filters.map((filter) => {
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
                              // value={filter.value}
                              // onChange={() => setUpdateMapLayerCalled(!updateMapLayerCalled)}
                              // className="aro-slider"
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
                                    // checked={value.checked || false}
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
          {/* )} */}
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
    locationLayers: getLocationLayersList(state).sort((a, b) => (b.key > a.key ? 1 : -1)),
    locationFilters: state.mapLayers.locationFilters,
    angularMapLayers: state.mapLayers.angularMapLayers,
    orderedLocationFilters: getOrderedLocationFilters(state),
    dataItems: state.plan.dataItems,
    showLocationLabels: state.viewSettings.showLocationLabels,
    selectedHeatMapOption: state.toolbar.selectedHeatMapOption,
    mapRef: state.map.googleMaps,
    configuration: state.configuration,
    zoom: state.map.zoom,
    map: state.map,
    selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
    plan: state.plan.activePlan,
    activePlanId: state.plan.activePlan && state.plan.activePlan.id,
    labelDrawingOptions: state.mapLayers.networkEquipment.labelDrawingOptions,
    mapReadyPromise: state.mapLayers.mapReadyPromise,
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateLayerVisibility: (layer, isVisible) => dispatch(MapLayerActions.setLayerVisibility(layer, isVisible)),
  setLocationFilterChecked: (filterType, ruleKey, isChecked) => dispatch(MapLayerActions.setLocationFilterChecked(filterType, ruleKey, isChecked)),
})

export default wrapComponentWithProvider(reduxStore, NearNetPanel, mapStateToProps, mapDispatchToProps)
