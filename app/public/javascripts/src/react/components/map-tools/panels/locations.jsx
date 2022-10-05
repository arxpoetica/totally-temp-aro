import React, { useEffect, useContext } from 'react'
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

// We need a selector, else the .toJS() call will create an infinite digest loop
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
let latestOverlay = null
let measuringStickEnabled = null // TODO - this is implemented in angular service
const drawingManager = new google.maps.drawing.DrawingManager({
  drawingMode: google.maps.drawing.OverlayType.POLYLINE,
  drawingControl: false,
})

function removeLatestOverlay() {
  latestOverlay && latestOverlay.setMap(null)
  latestOverlay = null
}

export const LocationsPanel = (props) => {
  const rxState = new RxState()
  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)
  const { visible, disabled, collapsed } = mapToolState
  const { MapToolActions, isMapToolExpanded, isMapToolVisible, objectKeyReplace } = globalMethods
  const {
    activePlanId,
    locationLayers,
    locationFilters,
    orderedLocationFilters,
    dataItems,
    showLocationLabels,
    selectedHeatMapOption,
    configuration,
    selectedDisplayMode,
    zoom,
    updateLayerVisibility,
    setLocationFilterChecked,
    labelDrawingOptions,
    angularMapLayers,
    map,
    mapReadyPromise,
    mapToolName,
  } = props
  let { createdMapLayerKeys, disablelocations, measuredDistance } = locationLayerState
  let localMapTileOptions = ''
  // Update map layers when the heatmap options change using react rxjs
  rxState.mapTileOptions.getMessage().subscribe((msg) => {
    // Adding this check to ensure updateMapLayers is called
    // only when there's an actual change in mapTileOptions
    if (localMapTileOptions && !dequal(localMapTileOptions, msg)) {
      updateMapLayers()
    }
    localMapTileOptions = { ...msg }
  })

  useEffect(() => {
    (async function () {
      await mapReadyPromise
      updateMapLayers()
    })()
  }, [])

  // Update map layers when the display mode button changes
  useEffect(() => {
    updateMapLayers()
  }, [
    activePlanId,
    zoom,
    selectedDisplayMode,
    selectedHeatMapOption,
    locationLayers.filter((layer) => layer.checked).length,
    locationFilters,
    dataItems.location && dataItems.location.selectedLibraryItems.length,
  ])

  drawingManager.addListener('overlaycomplete', (e) => {
    removeLatestOverlay()
    latestOverlay = e.overlay

    let points = e.overlay.getPath()
    let total = 0
    let prev = null
    points.forEach((point) => {
      if (prev) {
        total += google.maps.geometry.spherical.computeDistanceBetween(prev, point)
      }
      prev = point
    })
    measuredDistance = total

    const event = new CustomEvent('measuredDistance', {
      detail: total,
    })
    window.dispatchEvent(event)
  })

  document.addEventListener('keydown', (e) => {
    if (e.keyCode === 27 && measuringStickEnabled) {
      toggleMeasuringStick()
    }
  })

  function toggleMeasuringStick() {
    let current = drawingManager.getMap()
    drawingManager.setMap(current ? null : map)
    removeLatestOverlay()
    measuringStickEnabled = !current
    if (current) measuredDistance = null
  }

  // Get the point transformation mode with the current zoom level
  function getPointTransformForLayer(zoomThreshold) {
    let transform = ''
    // For other Clients except frontier
    if (configuration.system.ARO_CLIENT !== 'frontier') {
      // selectedHeatMapOption is a redux state which is set from too-bar-reducer.js
      if (selectedHeatMapOption === 'HEATMAP_OFF') {
        // The user has explicitly asked to display points, not aggregates
        transform = 'select'
      } else {
        let mapZoom = zoom
        // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
        // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
        transform = mapZoom > zoomThreshold ? 'select' : 'aggregate'
      }
    } else {
      if (selectedHeatMapOption === 'HEATMAP_OFF') {
        // The user has explicitly asked to display points, not aggregates
        transform = 'select'
      } else {
        let mapZoom = zoom
        // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
        // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
        transform = mapZoom > zoomThreshold ? 'select' : 'aggregate'
      }
    }
    return transform
  }

  let layerIconUrl = ''
  function getFeatureFilters() {
    const activeLocationFilters = configuration.ui.perspective.mapTools.locations.filters.filter((item) => item.useFilter)
    let featureFilters = []

    activeLocationFilters.forEach((locationFilter) => {
      let individualFilter = (feature) => true // A filter that returns back all the input items
      if (locationFilter.type === 'multiSelect') {
        const checkedAttributes = locationFilter.values.filter((item) => item.checked).map((item) => item.key)
        if (checkedAttributes.length > 0) {
          // Some items are selected. Apply filtering
          individualFilter = (feature) => checkedAttributes.indexOf(feature.properties[locationFilter.attributeKey]) >= 0

          const firstCheckedFilterWithIconUrl = locationFilter.values.filter((item) => item.checked && item.iconUrl)[0]
          if (firstCheckedFilterWithIconUrl) {
            layerIconUrl = firstCheckedFilterWithIconUrl.iconUrl
          }
        }
      } else if (locationFilter.type === 'threshold') {
        // For threshold we assume that the property value is going to be numeric
        individualFilter = (feature) => +feature.properties[locationFilter.attributeKey] > locationFilter.value
      }
      featureFilters.push(individualFilter)
    })

    return featureFilters
  }

  function getV2Filters() {
    if (locationFilters && Object.keys(locationFilters).length > 0) {
      // Define the v2Filters object ONLY if there are some filters defined in the system
      let v2Filters = []

      Object.keys(locationFilters).forEach((filterKey) => {
        const filter = locationFilters[filterKey]
        Object.keys(filter.rules).forEach((ruleKey) => {
          if (filter.rules[ruleKey].isChecked) {
            v2Filters.push(filter.rules[ruleKey])
          }
        })
      })
      return v2Filters
    }

  }

  // Creates map layers based on selection in the UI
  function updateMapLayers() {
    const {
      location: { protocol, hostname, port },
    } = window
    const baseUrl = `${protocol}//${hostname}:${port}`
    const oldMapLayers = { ...angularMapLayers.getValue() }

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    createdMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    let mergedLayerDefinitions = []

    // Add map layers based on the selection
    let v2Filters = null // If not null, the renderer will display zero objects
    v2Filters = getV2Filters()
    let selectedLocationLibraries = dataItems && dataItems.location && dataItems.location.selectedLibraryItems
    if (selectedLocationLibraries) {
      selectedLocationLibraries.forEach((selectedLocationLibrary) => {
        // Loop through the location types
        locationLayers.forEach((locationType) => {
          if (
            locationType.checked &&
            // Temp: 155808171 preventing calls to service if zoom is between 1 to 9 as service is not ready with pre-caching
            map &&
            zoom >= 10
          ) {
            disablelocations = false
            // First, construct the filtering function based on the selected values. Each 'featureFilter' corresponds
            // to a single filter (e.g. salesType).
            layerIconUrl = locationType.iconUrl
            let featureFilters = getFeatureFilters()
            // For sales tiles, we will also filter by the salesCategory. This is done just to keep the same logic as
            // non-sales tiles where we have small/medium/large businesses. This is actually just another type of filter.
            if (locationType.isSalesTile) {
              featureFilters.push((feature) => feature.properties.locationCategory === locationType.categoryKey)
            }
            // The final result of the filter is obtained by AND'ing the individual filters
            const featureFilter = (feature) => {
              let returnValue = true
              featureFilters.forEach((f) => {
                returnValue = returnValue && f(feature)
              })
              return returnValue
            }
            // Location type is visible
            let mapLayerKey = `${locationType.key}_${selectedLocationLibrary.identifier}`
            let pointTransform = getPointTransformForLayer(+locationType.aggregateZoomThreshold)
            let tileDefinitions = []
            locationType.tileDefinitions.forEach((rawTileDefinition) => {
              let tileDefinition = klona(rawTileDefinition)
              objectKeyReplace(tileDefinition, '${tilePointTransform}', pointTransform)
              objectKeyReplace(tileDefinition, '${libraryId}', selectedLocationLibrary.identifier)
              tileDefinitions.push(tileDefinition)
            })
            if (pointTransform === 'aggregate') {
              // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
              mergedLayerDefinitions = mergedLayerDefinitions.concat(tileDefinitions)
            } else {
              let drawingOptions = {
                strokeStyle: '#0000ff',
                labels: {
                  ...labelDrawingOptions,
                  properties: ['name'],
                },
              }
              // We want to create an individual layer
              let mapLayerProps = {
                tileDefinitions,
                iconUrl: `${baseUrl}${layerIconUrl}`,
                mduIconUrl: locationType.mduIconUrl && `${baseUrl}${locationType.mduIconUrl}`,
                renderMode: 'PRIMITIVE_FEATURES',
                strokeStyle: drawingOptions.strokeStyle,
                lineWidth: drawingOptions.lineWidth || 2,
                fillStyle: drawingOptions.fillStyle,
                opacity: drawingOptions.opacity || 0.5,
                zIndex: locationType.zIndex,
                selectable: true,
                featureFilter,
                v2Filters,
              }
              if (showLocationLabels) {
                // && zoom > this.networkEquipmentLayers.labelDrawingOptions.visibilityZoomThreshold
                mapLayerProps.drawingOptions = drawingOptions
              }
              oldMapLayers[mapLayerKey] = mapLayerProps
              createdMapLayerKeys.add(mapLayerKey)
            }
          } else if (map && zoom < 10) {
            disablelocations = true
          } else if (map && zoom >= 10) {
            disablelocations = false
          }
        })
      })
    }

    if (mergedLayerDefinitions.length > 0) {
      // We have some business layers that need to be merged into one
      // We still have to specify an iconURL in case we want to debug the heatmap rendering. Pick any icon.
      const firstLocation = locationLayers[0]
      const mapLayerKey = 'aggregated_locations'
      oldMapLayers[mapLayerKey] = {
        tileDefinitions: mergedLayerDefinitions,
        iconUrl: `${firstLocation.iconUrl}`,
        renderMode: 'HEATMAP',
        zIndex: 6500,
        aggregateMode: 'FLATTEN',
        v2Filters: v2Filters,
      }
      createdMapLayerKeys.add(mapLayerKey)
    }
    angularMapLayers.next(oldMapLayers)
  }

  function areAnyLocationLayersVisible() {
    return locationLayers.filter((layer) => layer.show).length > 0
  }

  function areAnyLocationFiltersVisible() {
    return locationFilters && Object.keys(locationFilters).length > 0
  }


  return (
    <MapTool className="location">
      <MapToolIcon
        handleClick={() =>
          dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })
        }
        toolId={"locations"}
        active={isMapToolVisible(visible, disabled, mapToolName)}
      />
      <div className="location-maptool-card">
        {measuredDistance && (
          <div className="map-tool panel panel-primary" id="measuring-stick-result">
            <div className="panel-heading">
              {`Measured distance: ${(
                measuredDistance * 0.000621371
              ).toFixed(2)} mi`}
            </div>
          </div>
        )}
        <MapToolCard mapToolName={mapToolName}>
          <CardHeader mapToolName={mapToolName} />
          <CardBody showCardBody={isMapToolExpanded(collapsed, mapToolName)}>
            {areAnyLocationFiltersVisible() && (
              <div className="row title">Location Filters</div>
            )}
            {Object.keys(orderedLocationFilters).length > 0 && 
              Object.keys(orderedLocationFilters).map(filterName => {
                const { rules } = orderedLocationFilters[filterName]
                return (
                  <div key={filterName}>
                    <ul className="customer-type">
                      {/* loop through all filter types */}
                      {Array.isArray(rules) && rules.map((rule, index) =>
                        <li key={index}>
                          <div className="ctype-icon">
                            <img className="image" src={rule.onPass.iconUrl} alt="location-icon" />
                          </div>
                          <div className="ctype-name">{rule.description}</div>
                          <div className="ctype-checkbox">
                            <input
                              type="checkbox"
                              className="checkboxfill"
                              checked={rule.isChecked || false}
                              onChange={() => setLocationFilterChecked(filterName, rule.ruleKey, !rule.isChecked)}
                            />
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                )
              })
            }
            {areAnyLocationLayersVisible() && (
              <div className="row title">Location Types</div>
            )}
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
                              checked={locationType.checked || false}
                              onChange={() =>
                                updateLayerVisibility(locationType, !locationType.checked)
                              }
                            />
                          </div>
                        </li>
                      )
                    )
                  })}
              </ul>
            </form>
            {disablelocations && (
              <div className="alert alert-warning" role="alert">
                Locations not displayed at this zoom level
              </div>
            )}
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

export default wrapComponentWithProvider(reduxStore, LocationsPanel, mapStateToProps, mapDispatchToProps)
