import React, { useContext, useEffect } from 'react'
import { createSelector } from 'reselect'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import reduxStore from '../../../../redux-store'
import MapLayerActions from '../../map-layers/map-layer-actions'
// import './copper-map-tool.css'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { CardBody } from '../card-body.jsx'
import { MapToolContext } from '../map-display-tools.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import MapTool from '../map-tool.jsx'

// We need a selector, else the .toJS() call will create an infinite digest loop
// https://www.npmjs.com/package/reselect
const getAllCopperLayers = (state) => state.mapLayers.copper
const getCopperLayersList = createSelector([getAllCopperLayers], (copperLayers) => copperLayers)
const getCopperArray = createSelector([getAllCopperLayers], (copperLayers) => {
  let copperArray = []
  if (copperLayers.categories) {
    Object.keys(copperLayers.categories).forEach((key) =>
      copperArray.push(copperLayers.categories[key]),
    )
  }
  return copperArray
})

const copperLayerState = {
  createdMapLayerKeys: new Set(),
}

const CopperPanel = (props) => {
  const {
    activePlanId,
    mapToolName,
    copperLayers,
    copperArray,
    mapReadyPromise,
    zoom,
    dataItems,
    angularMapLayers,
    updateLayerVisibility,
    mapLayers,
    showDirectedCable,
  } = props

  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)

  const { visible, disabled, collapsed } = mapToolState

  const {
    MapToolActions,
    isMapToolExpanded,
    isMapToolVisible,
    objectKeyReplace,
    getLineTransformForLayer,
    rulerActions,
    allRulerActions,
  } = globalMethods

  const { createdMapLayerKeys } = copperLayerState

  useEffect(() => {
    (async function () {
      await mapReadyPromise
      updateMapLayers()
    })()
  }, [])

  useEffect(() => {
    updateMapLayers()
  }, [
    activePlanId,
    zoom,
    dataItems.fiber && dataItems.fiber.selectedLibraryItems.length,
    dataItems.copper_cable && dataItems.copper_cable.selectedLibraryItems.length,
    copperLayers && copperLayers.categories && copperLayers.categories.UNKNOWN.checked,
  ])

  // Creates a single map layer by substituting tileDefinition parameters
  function createSingleMapLayer(copper, libraryId) {
    // const tileDefinition = JSON.parse(JSON.stringify(configuration.copperCategories.categories.UNKNOWN.tileDefinitions[0]))
    const tileDefinition = JSON.parse(
      JSON.stringify(mapLayers.copper.categories.UNKNOWN.tileDefinitions[0]),
    )
    objectKeyReplace(tileDefinition, '{libraryId}', libraryId)

    if (copper.equipmentType === 'line') {
      const lineTransform = getLineTransformForLayer(+copper.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    }

    // For equipments, we are going to filter out features that are planned and deleted
    let drawingOptions = JSON.parse(JSON.stringify(copper.drawingOptions))

    return {
      tileDefinitions: [tileDefinition],
      iconUrl: copper.iconUrl,
      greyOutIconUrl: copper.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES', // Always render equipment nodes as primitives
      featureFilter: null,
      strokeStyle: copper.drawingOptions.strokeStyle,
      lineWidth: copper.drawingOptions.lineWidth || 2,
      fillStyle: copper.drawingOptions.fillStyle,
      opacity: copper.drawingOptions.opacity || 0.5,
      drawingOptions,
      selectable: true,
      zIndex: copper.zIndex,
      showPolylineDirection: copper.drawingOptions.showPolylineDirection && showDirectedCable, // Showing Direction
      highlightStyle: copper.highlightStyle,
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  function createMapLayersForCategory(categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types (e.g. central_office)
    categoryItems &&
      Object.keys(categoryItems).forEach((categoryItemKey) => {
        let copper = categoryItems[categoryItemKey]

        if (copper.equipmentType !== 'point' || zoom > copper.aggregateZoomThreshold) {
          if (copper.checked) {
            // We need to show the existing copper. Loop through all the selected library ids.
            dataItems &&
              dataItems[copper.dataItemKey] &&
              dataItems[copper.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
                let mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
                mapLayers[mapLayerKey] = createSingleMapLayer(
                  copper,
                  selectedLibraryItem.identifier,
                )
                createdMapLayerKeys.add(mapLayerKey)
              })
          }
        }
        // Sync ruler option
        copper.key === 'UNKNOWN' && syncRulerOptions(copper.key, copper.checked)
      })
  }

  function updateMapLayers() {
    if (!copperLayers) return

    // Make a copy of the state mapLayers. We will update this
    const oldMapLayers = { ...angularMapLayers.getValue() }

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for copper
    createdMapLayerKeys.clear()
    createMapLayersForCategory(
      copperLayers.categories,
      'UNKNOWN',
      oldMapLayers,
      createdMapLayerKeys,
    )

    // "oldMapLayers" now contains the new layers. Set it in the state
    angularMapLayers.next(oldMapLayers)
  }

  function syncRulerOptions(layerKey, isLayerEnabled) {
    if (isLayerEnabled) {
      !rulerActions.includes(allRulerActions.COPPER) && rulerActions.push(allRulerActions.COPPER)
    } else {
      for (let i in rulerActions) {
        if (rulerActions[i].id === layerKey) {
          rulerActions.splice(i, 1)
        }
      }
    }
  }

  function getBackgroundColor(layer) {
    return layer.drawingOptions.strokeStyle
  }

  return (
    <MapTool className="copper">
      <MapToolIcon
        handleClick={() =>
          dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })
        }
        toolId="copper"
        active={isMapToolVisible(visible, disabled, mapToolName)}
      />
      <div className="copper-maptool-card">
        <MapToolCard mapToolName={mapToolName}>
          <CardHeader mapToolName={mapToolName} />
          <CardBody showCardBody={isMapToolExpanded(collapsed, mapToolName)}>
            <div className="row">
              <div className="col-md-12">
                <table className="table table-sm">
                  <tbody>
                    {/* TODO - orderBy listIndex */}
                    {copperArray.map((copperLayer, index) => {
                      return (
                        <tr key={index}>
                          <td style={{ borderTop: '0px' }}>
                            <div>
                              <div className="row-left">
                                <div
                                  className="box"
                                  style={{ backgroundColor: getBackgroundColor(copperLayer) }}
                                >
                                </div>
                                {copperLayer.label}
                              </div>
                              <div className="row-right">
                                <input
                                  type="checkbox"
                                  className="checkboxfill"
                                  checked={copperLayer.checked ? 'checked' : ''}
                                  onChange={() =>
                                    updateLayerVisibility(
                                      'UNKNOWN',
                                      copperLayer,
                                      !copperLayer.checked,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardBody>
        </MapToolCard>
      </div>
      <style jsx>
        {`
        .layer-type-checkboxes {
            padding-left: 5px;
            padding-right: 5px;
        }
        
        .label-message {
            float: right;
            cursor: pointer;
        }
        
        .box {
            width: 16px;
            height: 16px;
            margin-right: 15px;
            float: left
        }
        
        .row-left {
            display: inline-block;
            cursor: pointer;
        }
        
        .row-right {
            float: right;
        }
        
        .cable-foldout {
            padding: 4px 31px;
        }
        
        .cable-foldout-title {
            margin-left: -14px;
            padding-bottom: 2px;
        }
        `}
      </style>
    </MapTool>
  )
}

const mapStateToProps = (state) => {
  return {
    activePlanId: state.plan.activePlan && state.plan.activePlan.id,
    map: state.map,
    copperLayers: getCopperLayersList(state),
    copperArray: getCopperArray(state),
    mapReadyPromise: state.mapLayers.mapReadyPromise,
    zoom: state.map.zoom,
    dataItems: state.plan.dataItems,
    angularMapLayers: state.mapLayers.angularMapLayers,
    configuration: state.configuration,
    mapLayers: state.mapLayers,
    showDirectedCable: state.toolbar.showDirectedCable,
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateLayerVisibility: (layerType, layer, isVisible) => {
    // First set the visibility of the current layer
    dispatch(MapLayerActions.setCopperLayerVisibility(layerType, layer, isVisible))
  },
})

const CopperMapToolComponent = wrapComponentWithProvider(
  reduxStore,
  CopperPanel,
  mapStateToProps,
  mapDispatchToProps,
)

export default CopperMapToolComponent
