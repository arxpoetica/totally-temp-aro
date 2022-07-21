import React, { useEffect, useContext, useState } from 'react'
import { createSelector } from 'reselect'
import reduxStore from '../../../../redux-store'
import RxState from '../../../common/rxState'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import MapLayerActions from '../../map-layers/map-layer-actions'
import { MapToolContext } from '../map-display-tools.jsx'
import MapTool from '../map-tool.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { CardBody } from '../card-body.jsx'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllNetworkEquipmentLayers = (state) => state.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector(
  [getAllNetworkEquipmentLayers],
  (networkEquipmentLayers) => networkEquipmentLayers,
)
const getConduitsArray = createSelector([getAllNetworkEquipmentLayers], (networkEquipmentLayers) => {
  let conduitsArray = []
  if (networkEquipmentLayers.conduits) {
    Object.keys(networkEquipmentLayers.conduits).forEach((key) =>
      conduitsArray.push(networkEquipmentLayers.conduits[key]),
    )
  }
  return conduitsArray
})
const getRoadsArray = createSelector([getAllNetworkEquipmentLayers], (networkEquipmentLayers) => {
  let roadsArray = []
  if (networkEquipmentLayers.roads) {
    Object.keys(networkEquipmentLayers.roads).forEach((key) =>
      roadsArray.push(networkEquipmentLayers.roads[key]),
    )
  }
  return roadsArray
})

const conduitsLayerState = {
  createdMapLayerKeys: new Set(),
}

const ConduitsPanel = (props) => {
  const {
    activePlanId,
    networkEquipmentLayers,
    conduitsArray,
    roadsArray,
    dataItems,
    showDirectedCable,
    updateLayerVisibility,
    mapToolName,
    zoom,
    angularMapLayers,
  } = props

  const rxState = new RxState()

  const [updateMapLayerCalled, setUpdateMapLayerCalled] = useState(false)

  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)

  const { visible, disabled, collapsed } = mapToolState

  const { createdMapLayerKeys } = conduitsLayerState

  const {
    MapToolActions,
    isMapToolExpanded,
    isMapToolVisible,
    mapReadyPromise,
    objectKeyReplace,
    getLineTransformForLayer,
  } = globalMethods

  useEffect(() => {
    (async function () {
      await mapReadyPromise
      updateMapLayers()
    })()
  }, [])

  // Update map layers when the display mode button changes
  useEffect(() => {
    updateMapLayers()
  }, [activePlanId, zoom, dataItems.edge && dataItems.edge.selectedLibraryItems.length, updateMapLayerCalled])

  rxState.viewSettingsChanged
    .getMessage()
    .skip(1)
    .subscribe((data) => updateMapLayers())

  function createSingleMapLayer(conduitKey, categoryType, networkEquipment, libraryId) {
    const existingOrPlannedzIndex = networkEquipmentLayers.tileDefinitions[categoryType].zIndex // todo
    const tileDefinition = JSON.parse(
      JSON.stringify(networkEquipmentLayers.tileDefinitions[categoryType]),
    )
    delete tileDefinition.zIndex
    objectKeyReplace(tileDefinition, '{spatialEdgeType}', conduitKey)
    objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    const lineTransform = getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
    objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)

    // For equipments, we are going to filter out features that are planned and deleted
    let drawingOptions = JSON.parse(JSON.stringify(networkEquipment.drawingOptions))
    drawingOptions.lineWidth = (feature) =>
      networkEquipment.drawingOptions.lineWidths[feature.size_category] ||
      networkEquipment.drawingOptions.lineWidths.default

    return {
      tileDefinitions: [tileDefinition],
      iconUrl: networkEquipment.iconUrl,
      greyOutIconUrl: networkEquipment.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES', // Always render equipment nodes as primitives
      featureFilter: null,
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: networkEquipment.drawingOptions.lineWidth || 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      drawingOptions,
      selectable: true,
      zIndex: networkEquipment.zIndex + (existingOrPlannedzIndex || 0),
      showPolylineDirection:
        networkEquipment.drawingOptions.showPolylineDirection && showDirectedCable, // Showing Direction
      highlightStyle: networkEquipment.highlightStyle,
    }
  }

  function createMapLayersForCategory(categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types (e.g. central_office)
    categoryItems &&
      Object.keys(categoryItems).forEach((categoryItemKey) => {
        let networkEquipment = categoryItems[categoryItemKey]

        if (
          (networkEquipment.equipmentType !== 'point' ||
            zoom > networkEquipment.aggregateZoomThreshold) &&
          networkEquipment.checked
        ) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          dataItems &&
            dataItems[networkEquipment.dataItemKey] &&
            dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach(
              (selectedLibraryItem) => {
                let mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
                mapLayers[mapLayerKey] = createSingleMapLayer(
                  categoryItemKey,
                  categoryType,
                  networkEquipment,
                  selectedLibraryItem.identifier,
                )
                createdMapLayerKeys.add(mapLayerKey)
              },
            )
        }
      })
  }

  function updateMapLayers() {
    if (!networkEquipmentLayers) return

    // Make a copy of the state mapLayers. We will update this
    const oldMapLayers = { ...angularMapLayers.getValue() }

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for network equipment nodes and cables
    createdMapLayerKeys.clear()
    createMapLayersForCategory(
      networkEquipmentLayers.conduits,
      'conduit',
      oldMapLayers,
      createdMapLayerKeys,
    )
    createMapLayersForCategory(
      networkEquipmentLayers.roads,
      'road',
      oldMapLayers,
      createdMapLayerKeys,
    )

    // "oldMapLayers" now contains the new layers. Set it in the state
    angularMapLayers.next(oldMapLayers)
  }

  function getBackgroundColor(layer) {
    return layer.drawingOptions.strokeStyle
  }

  return (
    <MapTool className="conduits">
      <MapToolIcon
        handleClick={() =>
          dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })
        }
        toolId="conduits"
        active={isMapToolVisible(visible, disabled, mapToolName)}
      />

      <MapToolCard mapToolName={mapToolName}>
        <CardHeader mapToolName={mapToolName} />
        <CardBody showCardBody={isMapToolExpanded(collapsed, mapToolName)}>
          <div className="row">
            <div className="col-md-12">
              <table className="table table-sm">
                <tbody>
                  {roadsArray &&
                    roadsArray.map((roadLayer, index) => {
                      return (
                        <tr key={index}>
                          <td>
                            <div
                              className="box"
                              style={{ backgroundColor: getBackgroundColor(roadLayer) }}
                            ></div>
                            {roadLayer.label}
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="checkboxfill"
                              checked={roadLayer.checked || false}
                              onChange={() => {
                                setUpdateMapLayerCalled(!updateMapLayerCalled)
                                updateLayerVisibility('roads', roadLayer, !roadLayer.checked)
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  {conduitsArray &&
                    conduitsArray.map((conduitLayer, index) => {
                      return (
                        <tr key={index}>
                          <td>
                            <div
                              className="box"
                              style={{ backgroundColor: getBackgroundColor(conduitLayer) }}
                            ></div>
                            {conduitLayer.label}
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="checkboxfill"
                              checked={conduitLayer.checked || false}
                              onChange={() => {
                                setUpdateMapLayerCalled(!updateMapLayerCalled)
                                updateLayerVisibility(
                                  'conduits',
                                  conduitLayer,
                                  !conduitLayer.checked,
                                )
                              }}
                            />
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
      <style jsx>{`
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
      `}</style>
    </MapTool>
  )
}

const mapStateToProps = (state) => {
  return {
    activePlanId: state.plan.activePlan && state.plan.activePlan.id,
    networkEquipmentLayers: getNetworkEquipmentLayersList(state),
    conduitsArray: getConduitsArray(state).sort((a, b) => a.listIndex - b.listIndex),
    roadsArray: getRoadsArray(state).sort((a, b) => a.listIndex - b.listIndex),
    dataItems: state.plan.dataItems,
    mapRef: state.map.googleMaps,
    showDirectedCable: state.toolbar.showDirectedCable,
    zoom: state.map.zoom,
    angularMapLayers: state.mapLayers.angularMapLayers,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setNetworkEquipmentLayers: (networkEquipmentLayers) =>
      dispatch(MapLayerActions.setNetworkEquipmentLayers(networkEquipmentLayers)),
    updateLayerVisibility: (layerType, layer, isVisible) => {
      // First set the visibility of the current layer
      dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, isVisible))
    },
  }
}

export default wrapComponentWithProvider(
  reduxStore,
  ConduitsPanel,
  mapStateToProps,
  mapDispatchToProps,
)
