import React, { useEffect, useContext } from 'react'
import { MapToolContext } from '../map-display-tools.jsx'
import { connect } from 'react-redux'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { CardBody } from '../card-body.jsx'
import MapTool from '../map-tool.jsx'
import { createSelector } from 'reselect'
import MapLayerActions from '../../map-layers/map-layer-actions'
import RxState from '../../../common/rxState'
import { usePrevious } from '../../../common/view-utils.js'
import { dequal } from 'dequal'
import { klona } from 'klona'

const objectHasLength = (obj) => { return Object.keys(obj || {}).length }
const rxState = new RxState()
const createdMapLayerKeys = new Set()
// aggregating multiple pieces of equipment under one marker causes problems with Equipment Selection
const usePointAggregate = false

const objectKeyReplace = (obj, searchText, replaceText) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replaceAll(searchText, replaceText)
    }
  })
}

const NetworkEquipmentPanel = (props) => {

  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)
  const { visible, disabled, collapsed } = mapToolState
  const { MapToolActions, isMapToolExpanded, isMapToolVisible } = globalMethods

  const {
    planId,
    mapLayers,
    dataItems,
    mapToolName,
    mapZoomSize,
    tileDefinitions,
    appConfiguration,
    equipmentsArray,
    showSiteBoundary,
    setTypeVisibility,
    selectedDisplayMode,
    showEquipmentLabels,
    selectedBoundaryType,
    selectedLibraryItems,
    updateLayerVisibility,
    networkEquipmentLayers,
    equipmentLayerTypeVisibility,
    setNetworkEquipmentSubtypeVisibility,
  } = props

  const { perspective } = appConfiguration
  const { showExisting, showPlanned, mapLayers: networkMapLayers } = objectHasLength(appConfiguration) && perspective.networkEquipment

  useEffect(() => {
    updateMapLayers()
  }, [
    mapLayers,
    mapZoomSize,
    selectedDisplayMode,
    equipmentLayerTypeVisibility,
  ])

  const prevNetworkEquipmentLayers = usePrevious(networkEquipmentLayers)
  const prevSelectedBoundaryType = usePrevious(selectedBoundaryType)
  const prevShowSiteBoundary = usePrevious(showSiteBoundary)
  const prevSelectedLibraryItems = usePrevious(selectedLibraryItems)

  useEffect(() => {
    // We need to run an effect only on mapFeatures updates, so 'prevMapFeatures' & 'mapFeatures' is compared.
    if ((prevNetworkEquipmentLayers && !dequal(prevNetworkEquipmentLayers, networkEquipmentLayers))
      || (prevSelectedBoundaryType && !dequal(prevSelectedBoundaryType, selectedBoundaryType)
      || (prevShowSiteBoundary && !dequal(prevShowSiteBoundary, showSiteBoundary))
      || (prevSelectedLibraryItems && !dequal(prevSelectedLibraryItems, selectedLibraryItems)))) {
        updateMapLayers()
    }
  }, [networkEquipmentLayers, selectedBoundaryType, showSiteBoundary, selectedLibraryItems])

  const onUpdateTypeVisibility = (typeA, typeB, isVisible) => {
    // typeA: equipment / cable
    // typeB: existing / planned
    const typeVisibility = {}
    typeVisibility[typeA] = {}
    typeVisibility[typeA][typeB] = !isVisible
    setTypeVisibility(typeVisibility)
    updateMapLayers()
  }

  // Get the point transformation mode with the current zoom level
  const getPointTransformForLayer = (zoomThreshold) => {
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoomSize > zoomThreshold) ? 'select' : 'aggregate'
  }

  // Get the line transformation mode with the current zoom level
  const getLineTransformForLayer = (zoomThreshold) => {
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoomSize > zoomThreshold) ? 'select' : 'smooth_absolute'
  }

  const getPolygonTransformForLayer = (zoomThreshold) => {
    return (mapZoomSize > zoomThreshold) ? 'select' : 'smooth'
  }

  const createSingleMapLayer = (equipmentOrFiberKey, categoryType, networkEquipment, existingOrPlanned, libraryId, rootPlanId) => {
    const existingOrPlannedzIndex = tileDefinitions[categoryType][existingOrPlanned].zIndex
    const tileDefinition = klona(tileDefinitions[categoryType][existingOrPlanned])
    delete tileDefinition.zIndex
    objectKeyReplace(tileDefinition, '{networkNodeType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{fiberType}', equipmentOrFiberKey)
    objectKeyReplace(tileDefinition, '{libraryId}', libraryId)
    objectKeyReplace(tileDefinition, '{rootPlanId}', rootPlanId)
    
    if (networkEquipment.equipmentType === 'point') {
      const pointTransform = getPointTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{pointTransform}', pointTransform)
    } else if (networkEquipment.equipmentType === 'line') {
      const lineTransform = getLineTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{lineTransform}', lineTransform)
    } else if (networkEquipment.equipmentType === 'polygon') {
      const polygonTransform = getPolygonTransformForLayer(+networkEquipment.aggregateZoomThreshold)
      objectKeyReplace(tileDefinition, '{polygonTransform}', polygonTransform)
    }

    // For equipments, we are going to filter out features that are planned and deleted
    let featureFilter = null
    const drawingOptions = klona(networkEquipment.drawingOptions)
    let subtypes = null
    if (categoryType === 'equipment') {
      featureFilter = (feature) => {
        // For now, just hide equipment features that are Planned and Deleted
        return (!feature.properties.deployment_type ||
          (feature.properties.deployment_type === 1) ||
          (feature.properties.is_deleted !== 'true'))
      }

      if (showEquipmentLabels && map.getZoom() > networkEquipmentLayers.labelDrawingOptions.visibilityZoomThreshold) {
        drawingOptions.labels = networkEquipmentLayers.labelDrawingOptions
      }
      subtypes = { ...networkEquipment.subtypes }
    } else if (categoryType === 'boundaries') {
      featureFilter = (feature) => {
        // Show boundaries with the currently selected boundary type AND that are not marked as deleted
        return (feature.properties.boundary_type === selectedBoundaryType.id) &&
          (feature.properties.is_deleted !== 'true')
      }
      // Why this hack for boundaries? Because boundary layers are not explicitly shown via a checkbox in the UI.
      // So we just turn on the "0" subtype for all boundary layers. The filter will take care of hiding based on boundary type.
      subtypes = { 0: true }
    }

    return { // ToDo: this needs to be a class and the same class as in the reducer
      tileDefinitions: [tileDefinition],
      iconUrl: networkEquipment.iconUrl,
      greyOutIconUrl: networkEquipment.greyOutIconUrl,
      renderMode: 'PRIMITIVE_FEATURES', // Always render equipment nodes as primitives
      featureFilter,
      strokeStyle: networkEquipment.drawingOptions.strokeStyle,
      lineWidth: networkEquipment.drawingOptions.lineWidth || 2,
      fillStyle: networkEquipment.drawingOptions.fillStyle,
      opacity: networkEquipment.drawingOptions.opacity || 0.5,
      drawingOptions,
      selectable: true,
      zIndex: networkEquipment.zIndex + (existingOrPlannedzIndex || 0),
      highlightStyle: networkEquipment.highlightStyle,
      subtypes,
    }
  }

  // Creates map layers for a specified category (e.g. "equipment")
  const createMapLayersForCategory = (categoryItems, categoryType, mapLayers, createdMapLayerKeys) => {
    // First loop through all the equipment types (e.g. central_office)
    categoryItems && Object.keys(categoryItems).forEach((categoryItemKey) => {
      const networkEquipment = categoryItems[categoryItemKey]

      if (networkEquipment.equipmentType !== 'point' ||
        usePointAggregate ||
        mapZoomSize > networkEquipment.aggregateZoomThreshold) {
        if (equipmentLayerTypeVisibility.existing && networkEquipment.checked) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          dataItems && dataItems[networkEquipment.dataItemKey] &&
            dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              const mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }

        if (equipmentLayerTypeVisibility.planned && networkEquipment.checked && planId) {
          // We need to show the planned network equipment for this plan.
          const mapLayerKey = `${categoryItemKey}_planned`
          mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'planned', null, planId)
          createdMapLayerKeys.add(mapLayerKey)
        }
      }
    })
  }

  const createMapLayersForBoundaryCategory = (categoryItems, categoryType, mapLayers, createdMapLayerKeys) => {
    // First loop through all the equipment types
    // Boundary selection depends on showSiteBoundary checkbox and the selected boundary type in the dropdown
    categoryItems && Object.keys(categoryItems).forEach((categoryItemKey) => {
      const networkEquipment = categoryItems[categoryItemKey]

      let selectedBoundaryName = selectedBoundaryType.name !== 'fiveg_coverage'
        ? 'siteBoundaries'
        : 'fiveg_coverage'

      // Type of Boundary to show
      if ((networkEquipment.equipmentType !== 'point' ||
        usePointAggregate ||
        mapZoomSize > networkEquipment.aggregateZoomThreshold) && selectedBoundaryName === categoryItemKey) {

        // Existing Boundaries
        if (equipmentLayerTypeVisibility.existing && showSiteBoundary) {
          // We need to show the existing network equipment. Loop through all the selected library ids.
          dataItems && dataItems[networkEquipment.dataItemKey] &&
            dataItems[networkEquipment.dataItemKey].selectedLibraryItems.forEach((selectedLibraryItem) => {
              const mapLayerKey = `${categoryItemKey}_existing_${selectedLibraryItem.identifier}`
              mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'existing', selectedLibraryItem.identifier, null)
              createdMapLayerKeys.add(mapLayerKey)
            })
        }

        // Planned Boundaries
        if (equipmentLayerTypeVisibility.planned && showSiteBoundary && planId) {
          // We need to show the planned network equipment for this plan.
          const mapLayerKey = `${categoryItemKey}_planned`
          mapLayers[mapLayerKey] = createSingleMapLayer(categoryItemKey, categoryType, networkEquipment, 'planned', null, planId)
          createdMapLayerKeys.add(mapLayerKey)
        }
      }

    })
  }

  // ToDo: this does not belong here. Don't put the powerplant in the light switch.
  const updateMapLayers = () => {
    if (!networkEquipmentLayers) return
    // Make a copy of the state mapLayers. We will update this
    const oldMapLayers = { ...mapLayers.getValue() }

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    // Create layers for network equipment nodes
    createdMapLayerKeys.clear()
    createMapLayersForCategory(networkEquipmentLayers.equipments, 'equipment', oldMapLayers, createdMapLayerKeys)
    createMapLayersForBoundaryCategory(networkEquipmentLayers.boundaries, 'boundaries', oldMapLayers, createdMapLayerKeys)

    // "oldMapLayers" now contains the new layers. Set it in the state
    mapLayers.next(oldMapLayers)
  }

  const zoomTo = (zoomLevel) => {
    zoomLevel = Number(zoomLevel) + 1
    rxState.requestSetMapZoom.sendMessage(zoomLevel)
  }

  return (
    <MapTool className="network_nodes">
      <MapToolIcon
        handleClick={() => dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })}
        toolId={'network_nodes'}
        active={isMapToolVisible(visible, disabled, mapToolName)}
      />

      <MapToolCard
        isMapToolVisible={isMapToolVisible}
        visible={visible}
        disabled={disabled}
        mapToolName={mapToolName}
      >

        <CardHeader mapToolName={mapToolName} />

        <CardBody showCardBody={isMapToolExpanded(collapsed, mapToolName)}>
          {/* New implementation of network equipments */}
          <div className="row equipment-type-container">
            <div className="col-md-4">
              <strong className="equipment-type-label">Type</strong>
            </div>
            {showExisting &&
              <div className="col-md-4">
                <input
                  type="checkbox"
                  className="checkboxfill layer-type-checkboxes"
                  value={equipmentLayerTypeVisibility.existing}
                  onChange={() => onUpdateTypeVisibility('equipment', 'existing', equipmentLayerTypeVisibility.existing)}
                />
                <span>&nbsp;Existing</span>
              </div>
            }
            {showPlanned &&
              <div className="col-md-4">
                <input
                  type="checkbox"
                  className="checkboxfill layer-type-checkboxes"
                  value={equipmentLayerTypeVisibility.planned}
                  onChange={() => onUpdateTypeVisibility('equipment', 'planned', equipmentLayerTypeVisibility.planned)}
                />
                <span>&nbsp;Planned</span>
              </div>
            }
          </div>
          <div className="row">
            <div className="col-md-12">
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td colSpan="2"><strong>Equipment</strong></td>
                  </tr>
                  {equipmentsArray.length > 0 && equipmentsArray.map((equipmentLayer, index) =>
                    networkMapLayers && networkMapLayers.areVisible.indexOf(equipmentLayer.key) >= 0 &&
                    <tr key={index}>
                      <td>
                        <>
                          <div className="row-left">
                            <img src={equipmentLayer.iconUrl} className="equipment-icon" />
                            {equipmentLayer.label}
                          </div>
                          <div className="row-right">
                            {mapZoomSize <= equipmentLayer.aggregateZoomThreshold && equipmentLayer.equipmentType === 'point' &&
                              <button
                                type="button"
                                className="btn btn-primary btn-thin"
                                onClick={() => zoomTo(equipmentLayer.aggregateZoomThreshold)}
                                data-toggle="tooltip"
                                title="Zoom To"
                              >
                                <span className="fa fa-expand" />
                              </button>
                            }
                            &nbsp;
                            <input
                              type="checkbox"
                              className="checkboxfill"
                              disabled={mapZoomSize <= equipmentLayer.aggregateZoomThreshold && equipmentLayer.equipmentType === 'point'}
                              checked={equipmentLayer.subtypes[0] ? equipmentLayer.subtypes[0] : ''}
                              onChange={() => updateLayerVisibility('equipments', equipmentLayer, !equipmentLayer.subtypes[0])}
                            />
                          </div>
                        </>
                        {equipmentLayer.subtypeLayers && equipmentLayer.subtypeLayers.map((subtypeLayer, index) =>
                          <div key={index}>
                            <div className="row-left">
                              <img src={equipmentLayer.iconUrl} className="equipment-icon" />
                              {subtypeLayer.description}
                            </div>
                            <div className="row-right">
                              {mapZoomSize <= equipmentLayer.aggregateZoomThreshold && equipmentLayer.equipmentType === 'point' &&
                                <button
                                  type="button"
                                  className="btn btn-primary btn-thin"
                                  onClick={() => zoomTo(equipmentLayer.aggregateZoomThreshold)}
                                  data-toggle="tooltip"
                                  title="Zoom To"
                                >
                                  <span className="fa fa-expand" />
                                </button>
                              }
                              <input
                                type="checkbox"
                                className="checkboxfill"
                                disabled={mapZoomSize <= equipmentLayer.aggregateZoomThreshold && equipmentLayer.equipmentType === 'point'}
                                checked={equipmentLayer.subtypes[subtypeLayer.id] ? equipmentLayer.subtypes[subtypeLayer.id] : ''}
                                onChange={() => setNetworkEquipmentSubtypeVisibility('equipments', equipmentLayer, subtypeLayer.id, !equipmentLayer.subtypes[subtypeLayer.id])}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <style jsx>{`
            .equipment-type-container {
              padding-bottom: 5px;
            }
            .equipment-type-label {
              padding-left: 5px;
            }
            .equipment-icon {
              width: 16px;
              margin-right: 15px;
            }
            .layer-type-checkboxes {
              padding-left: 5px;
              padding-right: 5px;
            }          
            .row-left {
              display: inline-block;
              cursor: pointer;
            }
            .row-right {
              float: right;
            }
          `}</style>
        </CardBody>
      </MapToolCard>
    </MapTool>
  )
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllNetworkEquipmentLayers = reduxState => reduxState.mapLayers.networkEquipment
const getNetworkEquipmentLayersList = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => networkEquipmentLayers)
const getEquipmentsArray = createSelector([getAllNetworkEquipmentLayers], networkEquipmentLayers => {
  const equipmentsArray = []
  if (networkEquipmentLayers.equipments) {
    Object.keys(networkEquipmentLayers.equipments).forEach(key => equipmentsArray.push(networkEquipmentLayers.equipments[key]))
  }
  return equipmentsArray.sort((a, b) => a.listIndex - b.listIndex)
})

const mapStateToProps = (state) => ({
  mapZoomSize: state.map.zoom,
  mapTools: state.map.map_tools,
  dataItems: state.plan.dataItems,
  equipmentsArray: getEquipmentsArray(state),
  mapLayers: state.mapLayers.angularMapLayers,
  showSiteBoundary: state.mapLayers.showSiteBoundary,
  showEquipmentLabels: state.toolbar.showEquipmentLabels,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  planId: state.plan.activePlan && state.plan.activePlan.id,
  selectedBoundaryType: state.mapLayers.selectedBoundaryType,
  tileDefinitions: state.mapLayers.networkEquipment.tileDefinitions,
  appConfiguration: objectHasLength(state.toolbar.appConfiguration)
    && state.toolbar.appConfiguration,
    networkEquipmentLayers: getNetworkEquipmentLayersList(state),
  selectedLibraryItems: objectHasLength(state.plan.dataItems)
    && state.plan.dataItems.equipment.selectedLibraryItems,
  equipmentLayerTypeVisibility: state.mapLayers.typeVisibility.equipment,
})

const mapDispatchToProps = (dispatch) => ({
  setTypeVisibility: (typeVisibility) => dispatch(MapLayerActions.setTypeVisibility(typeVisibility)),
  updateLayerVisibility: (layerType, layer, isVisible) => {
    dispatch(MapLayerActions.setNetworkEquipmentLayerVisibility(layerType, layer, isVisible))
  },
  setNetworkEquipmentSubtypeVisibility: (layerType, layer, subtypeId, isVisible) => {
    dispatch(MapLayerActions.setNetworkEquipmentSubtypeVisibility(layerType, layer, subtypeId, isVisible))
  },
})

export default connect(mapStateToProps, mapDispatchToProps)(NetworkEquipmentPanel)
