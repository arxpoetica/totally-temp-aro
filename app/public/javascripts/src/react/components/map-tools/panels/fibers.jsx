import React, { useEffect, useState, useContext } from 'react'
import { MapToolContext } from '../map-display-tools.jsx'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { klona } from 'klona'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { CardBody } from '../card-body.jsx'
import MapLayerActions from '../../map-layers/map-layer-actions'
import RxState from '../../../common/rxState'
import MapTool from '../map-tool.jsx'


const fiberLayerState = {
  createdMapLayerKeys: new Set(),
}

const FibersPanel = (props) => {
  const {
    mapToolName,
    mapReadyPromise,
    zoom,
    cablesArray,
    conduitsArray,
    networkEquipmentLayers,
    dataItems,
    angularMapLayers,
    updateLayerVisibility,
    configuration,
    showDirectedCable,
    setTypeVisibility,
    setCableConduitVisibility,
    cableLayerTypeVisibility,
    planId,
  } = props

  const rxState = new RxState()

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

  const { createdMapLayerKeys } = fiberLayerState

  const [openRow, setOpenRow] = useState(null)

  const [updateMapLayerCalled, setUpdateMapLayerCalled] = useState(false)

  rxState.viewSettingsChanged
    .getMessage()
    .skip(1)
    .subscribe(() => updateMapLayers())

  useEffect(() => {
    (async function () {
      await mapReadyPromise
      updateMapLayers()
    })()
  }, [])

  useEffect(() => {
    updateMapLayers()
  }, [
    planId,
    zoom,
    dataItems.fiber && dataItems.fiber.selectedLibraryItems.length,
    updateMapLayerCalled,
    networkEquipmentLayers.cables &&
      Object.keys(networkEquipmentLayers.cables).filter(
        (key) => networkEquipmentLayers.cables[key].checked,
      ).length,
  ])

  function toggleOpenRow(rowId) {
    if (openRow === rowId) {
      setOpenRow(null)
    } else {
      setOpenRow(rowId)
    }
  }

  // Creates a single map layer by substituting tileDefinition parameters
  function createSingleMapLayer(
    equipmentOrFiberKey,
    categoryType,
    networkEquipment,
    existingOrPlanned,
    libraryId,
    rootPlanId,
  ) {
    const existingOrPlannedzIndex =
      networkEquipmentLayers.tileDefinitions[categoryType][existingOrPlanned].zIndex
    const tileDefinition = klona(networkEquipmentLayers.tileDefinitions[categoryType][existingOrPlanned])
    delete tileDefinition.zIndex

    objectKeyReplace(tileDefinition, '{networkNodeType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{fiberType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    objectKeyReplace(tileDefinition, '{rootPlanId}', rootPlanId)

    if (networkEquipment.equipmentType === 'line') {
      const lineTransform = getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    }

    // For equipments, we are going to filter out features that are planned and deleted
    let drawingOptions = klona(networkEquipment.drawingOptions)

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

  // Creates map layers for a specified category (e.g. "equipment")
  function createMapLayersForCategory(categoryItems, categoryType, mapLayers, createdMapLayerKeys) {
    // First loop through all the equipment types (e.g. central_office)
    categoryItems &&
      Object.keys(categoryItems).forEach((categoryItemKey) => {
        let networkEquipment = categoryItems[categoryItemKey]

        if (
          networkEquipment.equipmentType !== 'point' ||
          zoom > networkEquipment.aggregateZoomThreshold
        ) {
          if (networkEquipment.checked && cableLayerTypeVisibility.existing) {
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
                    'existing',
                    selectedLibraryItem.identifier,
                    null,
                  )
                  createdMapLayerKeys.add(mapLayerKey)
                },
              )
          }

          if (networkEquipment.checked && cableLayerTypeVisibility.planned && planId) {
            let mapLayerKey = `${categoryItemKey}_planned`
            mapLayers[mapLayerKey] = createSingleMapLayer(
              categoryItemKey,
              categoryType,
              networkEquipment,
              'planned',
              null,
              planId,
            )
            createdMapLayerKeys.add(mapLayerKey)
          }
        }

        // Sync ruler option
        networkEquipment.key === 'COPPER' &&
          syncRulerOptions(networkEquipment.key, networkEquipment.checked)
      })
  }

  function onUpdateExistingCableVisibility() {
    // these shouldn't be hardcoded but this will all be migrated shortly
    onUpdateTypeVisibility('cable', 'existing', cableLayerTypeVisibility.existing)
  }

  function onUpdatePlannedCableVisibility() {
    onUpdateTypeVisibility('cable', 'planned', cableLayerTypeVisibility.planned)
  }

  function onUpdateTypeVisibility(typeA, typeB, isVisible) {
    // typeA: equipment / cable
    // typeB: existing / planned
    let typeVisibility = {}
    typeVisibility[typeA] = {}
    typeVisibility[typeA][typeB] = !isVisible
    setTypeVisibility(typeVisibility)

    setUpdateMapLayerCalled(!updateMapLayerCalled)
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
      networkEquipmentLayers.cables,
      'cable',
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
    <MapTool className="fiber">
      <MapToolIcon
        handleClick={() =>
          dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })
        }
        toolId="cables"
        active={isMapToolVisible(visible, disabled, mapToolName)}
      />
      <div className="fiber-maptool-card">
        <MapToolCard mapToolName={mapToolName}>
          <CardHeader mapToolName={mapToolName} />
          <CardBody showCardBody={isMapToolExpanded(collapsed, mapToolName)}>
            <div className="row" style={{ paddingBottom: '5px' }}>
              <div className="col-md-4">
                <strong style={{ paddingBottom: '5px' }}>Type</strong>
              </div>

              {configuration.ui.perspective.networkEquipment &&
                configuration.ui.perspective.networkEquipment.showExisting && (
                  <div className="col-md-4">
                    <input
                      type="checkbox"
                      className="checkboxfill layer-type-checkboxes"
                      checked={cableLayerTypeVisibility.existing ? 'checked' : ''}
                      onChange={() => onUpdateExistingCableVisibility()}
                    />
                    <span>&nbsp;Existing</span>
                  </div>
                )}

              {configuration.ui.perspective.networkEquipment &&
                configuration.ui.perspective.networkEquipment.showPlanned && (
                  <div className="col-md-4">
                    <input
                      type="checkbox"
                      className="checkboxfill layer-type-checkboxes"
                      checked={cableLayerTypeVisibility.planned ? 'checked' : ''}
                      onChange={() => onUpdatePlannedCableVisibility()}
                    />
                    <span>&nbsp;Planned</span>
                  </div>
                )}
            </div>

            <div className="row">
              <div className="col-md-12">
                <table className="table table-sm">
                  <tbody>
                    {/* TODO - orderBy listIndex */}
                    {cablesArray.map((cableLayer, index) => <tr key={index}>
                          <td>
                            <div>
                              <div
                                className="row-left"
                                onClick={() => toggleOpenRow(cableLayer.key)}
                              >
                                <div className="box">
                                  {openRow !== cableLayer.key ? (
                                    <i className="far fa-plus-square"/>
                                  ) : (
                                    <i className="far fa-minus-square"/>
                                  )}
                                </div>
                                <div
                                  className="box"
                                  style={{ backgroundColor: getBackgroundColor(cableLayer) }}
                                ></div>
                                {cableLayer.label}
                              </div>
                              <div className="row-right">
                                <input
                                  type="checkbox"
                                  className="checkboxfill"
                                  checked={cableLayer.checked ? 'checked' : ''}
                                  onChange={() =>
                                    updateLayerVisibility('cables', cableLayer, !cableLayer.checked)
                                  }
                                />
                              </div>
                            </div>
                            {openRow === cableLayer.key && (
                              <div className="cable-foldout">
                                <div className="cable-foldout-title">
                                  <strong>Conduit Visibility</strong>
                                </div>
                                {/* TODO - orderBy listIndex */}
                                {conduitsArray.map((conduitLayer, index) => {
                                  return (
                                    <div key={index}>
                                      <div className="row-left">
                                        <div
                                          className="box"
                                          style={{
                                            backgroundColor: getBackgroundColor(conduitLayer),
                                          }}
                                        ></div>
                                        {conduitLayer.label}
                                      </div>
                                      <div className="row-right">
                                        <input
                                          type="checkbox"
                                          className="checkboxfill"
                                          checked={cableLayer.conduitVisibility[conduitLayer.key] ? 'checked' : ''}
                                          onChange={() => {
                                            setUpdateMapLayerCalled(!updateMapLayerCalled)
                                            setCableConduitVisibility(
                                              cableLayer.key,
                                              conduitLayer.key,
                                              !cableLayer.conduitVisibility[conduitLayer.key],
                                            )
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                    )}
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
        .card-body .row:first-child {
          padding-bottom: 5px;
        }
        .col-md-4 strong {
          padding-bottom: 5px;
        }
      `}
      </style>
    </MapTool>
  )
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllNetworkEquipmentLayers = (state) => state.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector(
  [getAllNetworkEquipmentLayers],
  (networkEquipmentLayers) => networkEquipmentLayers,
)
const getCablesArray = createSelector([getAllNetworkEquipmentLayers], (networkEquipmentLayers) => {
  const cablesArray = []
  if (networkEquipmentLayers.cables) {
    Object.keys(networkEquipmentLayers.cables).forEach((key) =>
      cablesArray.push(networkEquipmentLayers.cables[key]),
    )
  }
  cablesArray.sort( (a,b) => a.listIndex - b.listIndex )
  return cablesArray
})

const getConduitsArray = createSelector(
  [getAllNetworkEquipmentLayers],
  (networkEquipmentLayers) => {
    const conduitsArray = []
    if (networkEquipmentLayers.roads) {
      Object.keys(networkEquipmentLayers.roads).forEach((key) =>
        conduitsArray.push(networkEquipmentLayers.roads[key]),
      )
    }
    if (networkEquipmentLayers.conduits) {
      Object.keys(networkEquipmentLayers.conduits).forEach((key) =>
        conduitsArray.push(networkEquipmentLayers.conduits[key]),
      )
    }
    return conduitsArray
  },
)

const mapStateToProps = (state) => {
  return {
    map: state.map,
    networkEquipmentLayers: getNetworkEquipmentLayersList(state),
    cablesArray: getCablesArray(state),
    conduitsArray: getConduitsArray(state),
    mapReadyPromise: state.mapLayers.mapReadyPromise,
    zoom: state.map.zoom,
    dataItems: state.plan.dataItems,
    angularMapLayers: state.mapLayers.angularMapLayers,
    configuration: state.configuration,
    mapLayers: state.mapLayers,
    showDirectedCable: state.toolbar.showDirectedCable,
    planId: state.plan.activePlan && state.plan.activePlan.id,
    cableLayerTypeVisibility: state.mapLayers.typeVisibility.cable,
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateLayerVisibility: (layerType, layer, isVisible) => {
    // First set the visibility of the current layer
    dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, isVisible))
  },
  setTypeVisibility: (typeVisibility) =>
    dispatch(MapLayerActions.setTypeVisibility(typeVisibility)),
  setCableConduitVisibility: (cableKey, conduitKey, isVisible) =>
    dispatch(MapLayerActions.setCableConduitVisibility(cableKey, conduitKey, isVisible)),
})

export default connect(mapStateToProps, mapDispatchToProps)(FibersPanel)
