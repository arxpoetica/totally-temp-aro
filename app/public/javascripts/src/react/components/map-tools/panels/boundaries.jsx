import React, { useEffect, useContext } from 'react'
import { MapToolContext } from '../map-display-tools.jsx'
import { connect } from 'react-redux'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { CardBody } from '../card-body.jsx'
import { usePrevious } from '../../../common/view-utils.js'
import MapLayerActions from '../../map-layers/map-layer-actions'
import SelectionActions from '../../selection/selection-actions'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import { createSelector } from 'reselect'
import { List } from 'immutable'
import { dequal } from 'dequal'
import { klona } from 'klona'
import MapTool from '../map-tool.jsx'

const objectHasLength = (obj) => { return Object.keys(obj || {}).length }
const createdMapLayerKeys = new Set()

// Get the point transformation mode with the current zoom level
const getPointTransformForLayer = (zoomThreshold) => {
  const mapZoom = map.getZoom()
  // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
  // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
  return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
}

// Replaces any occurrences of searchText by replaceText in the keys of an object
const objectKeyReplace = (obj, searchText, replaceText) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(searchText, replaceText)
    }
  })
}

const BoundariesPanel = (props) => {

  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)
  const { visible, disabled, collapsed } = mapToolState
  const { MapToolActions, isMapToolExpanded, isMapToolVisible } = globalMethods

  const {
    mapToolName,
    boundaryLayers,
    updateLayerVisibility,
    appConfiguration,
    loadEntityList,
    setBoundaryLayers,
    mapLayers,
    selectedLibraryItems,
    mapZoomChanged,
    setMapSelection,
    selectedDisplayMode,
    cloneSelection,
  } = props

  const { perspective, boundaryCategories } = appConfiguration
  const { showBoundaries } = objectHasLength(appConfiguration) && perspective

  useEffect(() => {
    // When the perspective changes, some map layers may be hidden/shown.
    reloadVisibleLayers()
  }, [perspective])

  useEffect(() => {
    updateMapLayers()
  }, [
    mapLayers,
    mapZoomChanged,
    selectedLibraryItems,
    selectedDisplayMode
  ])

  const prevBoundaryLayers = usePrevious(boundaryLayers)
  const prevSelectedLibraryItems = usePrevious(selectedLibraryItems)
  useEffect(() => {
    // We need to run an effect only on mapFeatures updates, so 'prevMapFeatures' & 'mapFeatures' is compared.
    if ((prevBoundaryLayers && !dequal(prevBoundaryLayers, boundaryLayers))
      || (prevSelectedLibraryItems && !dequal(prevSelectedLibraryItems, selectedLibraryItems))) {
        updateMapLayers()
    }
  }, [boundaryLayers, selectedLibraryItems])

  const reloadVisibleLayers = async() => {
    try {
      let analysisLayers = await loadEntityList('AnalysisLayer', null, 'id,name,description', null)
      const newTileLayers = []
      let filteredGlobalServiceLayers = globalServiceLayers
      if (perspective && perspective.limitBoundaries.enabled) {
        const namesToInclude = perspective.limitBoundaries.showOnlyNames
        filteredGlobalServiceLayers = globalServiceLayers.filter((item) => namesToInclude.indexOf(item.name) >= 0)
      }
      let uiLayerId = 0
      filteredGlobalServiceLayers.forEach((serviceLayer) => {
        if (!serviceLayer.show_in_boundaries) return
        const wirecenterLayer = {
          uiLayerId: uiLayerId++,
          description: serviceLayer.description, // Service Areas
          type: 'wirecenter',
          key: 'wirecenter',
          analysisLayerId: serviceLayer.id,
        }
        newTileLayers.push(wirecenterLayer)
      })

      let includeCensusBlocks = true
      if (perspective && perspective.limitBoundaries.enabled) {
        const namesToInclude = perspective.limitBoundaries.showOnlyNames
        includeCensusBlocks = namesToInclude.indexOf('census_blocks') >= 0
      }
      if (includeCensusBlocks) {
        newTileLayers.push({
          uiLayerId: uiLayerId++,
          description: 'Census Blocks',
          type: 'census_blocks',
          key: 'census_blocks',
          // NOTE: `-10` is hard coded on the back end as well, so this matches that
          analysisLayerId: -10,
        })
      }

      if (perspective && perspective.limitBoundaries.enabled) {
        const namesToInclude = perspective.limitBoundaries.showOnlyNames
        analysisLayers = analysisLayers.filter((item) => namesToInclude.indexOf(item.name) >= 0)
      }
      analysisLayers.forEach((analysisLayer) => {
        newTileLayers.push({
          uiLayerId: uiLayerId++,
          description: analysisLayer.description,
          type: 'analysis_layer',
          key: 'analysis_layer',
          analysisLayerId: analysisLayer.id
        })
      })

      // enable visible boundaries by default
      newTileLayers.forEach((tileLayers) => {
        const isLayerVisible = boundaryCategories && boundaryCategories.categories[tileLayers.type].visible
        tileLayers.checked = isLayerVisible
      })
      setBoundaryLayers(new List(newTileLayers))
      // setBoundaryLayers(new List(boundaryCont))
      return Promise.resolve()
    } catch (err) {
      console.error(err)
    }
  }

  const updateMapLayers = () => {
    // ToDo: this function could stand to be cleaned up
    // ToDo: layerSettings will come from settings, possibly by way of one of the other arrays
    const layerSettings = boundaryCategories && boundaryCategories.categories

    if (layerSettings && layerSettings.wirecenter) {
      layerSettings.default = layerSettings.wirecenter
    }

    // Make a copy of the state mapLayers. We will update this
    const oldMapLayers = { ...mapLayers.getValue() }
    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    createdMapLayerKeys.clear()

    // Add map layers based on the selection
    const selectedServiceAreaLibraries = selectedLibraryItems
    if (selectedServiceAreaLibraries) {
      selectedServiceAreaLibraries.forEach((selectedServiceAreaLibrary) => {
        boundaryLayers.forEach((layer) => {
          if (layer.checked) {
            const layerOptions = layerSettings[layer.type]
            const pointTransform = getPointTransformForLayer(+layerOptions.aggregateZoomThreshold)
            const mapLayerKey = `${pointTransform}_${layer.uiLayerId}_${selectedServiceAreaLibrary.identifier}`
            let settingsKey = (pointTransform === 'smooth') ? 'aggregated_' + layer.type : layer.type

            if (!layerSettings.hasOwnProperty(settingsKey)) { settingsKey = 'default' }
            oldMapLayers[mapLayerKey] = JSON.parse(JSON.stringify(layerSettings[settingsKey]))
            const tileDefinition = JSON.parse(JSON.stringify(layerOptions.tileDefinition))
            objectKeyReplace(tileDefinition, '{transform}', pointTransform)
            objectKeyReplace(tileDefinition, '{libraryId}', selectedServiceAreaLibrary.identifier)
            objectKeyReplace(tileDefinition, '{analysisLayerId}', layer.analysisLayerId)
            oldMapLayers[mapLayerKey].tileDefinitions = [tileDefinition]
            createdMapLayerKeys.add(mapLayerKey)
          }
        })
      })
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    mapLayers.next(oldMapLayers)
  }

  const onSelectCategory = (category) => {
    const newSelection = cloneSelection()
    newSelection.details.layerCategoryId = category && category.id
    newSelection.details.categorySelections = boundaryLayers.map(layer => {
      const { selectedCategory } = layer
      if (!selectedCategory) { return false }
      return {
        layerCategoryId: selectedCategory.id,
        analysisLayerId: selectedCategory.analysisLayerId,
      }
    }).filter(Boolean)
    setMapSelection(newSelection)
  }

  const updateSelectedCategory = (uiLayerId, categoryId) => {
    boundaryLayers.forEach((layer) => {
      if (layer.uiLayerId === uiLayerId && parseInt(categoryId) > 0) {
        layer.selectedCategory = layer.categories[categoryId]
      } else {
        layer.selectedCategory = null
      }
    })
    setBoundaryLayers(new List(klona(boundaryLayers)))
  }

  return (
    <MapTool className="boundaries">
      <MapToolIcon
        handleClick={() => dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })}
        toolId='boundaries'
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
          <div className="boundaries-container">
            {boundaryLayers.map((layer) =>
              showBoundaries && showBoundaries[layer.type] &&
                <div className={`checkbox ${layer.disabled ? 'disabled' : ''}`}
                  key={`map_layers_toggle_${layer.uiLayerId}`}
                >
                  <div className="float-right">
                    <input
                      type="checkbox"
                      className="checkboxfill"
                      name="ctype-name"
                      checked={layer.checked ? layer.checked : ''}
                      disabled={layer.disabled ? layer.disabled : false}
                      onChange={() => updateLayerVisibility(layer, !layer.checked)}
                    />
                  </div>
                  <div className="float-right boundary-spinner">
                    <span className={`fa fa-repeat map-layer-spinner map-layer-spinner-${layer.type}`} />
                  </div>
                  <label>
                    {layer.description}
                    {objectHasLength(layer.categories) > 0 && layer.checked &&
                      <div className="layer-categories">
                        <select
                          className='form-control dropdown'
                          value={layer.selectedCategory ? layer.selectedCategory.id : 0}
                          onChange={(event) => {
                            updateSelectedCategory(layer.uiLayerId, event.target.value)
                            onSelectCategory(layer.selectedCategory)
                          }}
                        >
                          <option value={0}>None</option>
                          {Object.entries(layer.categories).map(([key, item]) => 
                            <option value={item.id} key={item.id}>{item.description}</option>
                          )}
                        </select>
                        {layer.selectedCategory &&
                          Object.entries(layer.selectedCategory.tags).map(([key, tag]) => <div key={tag.id}>
                            <div
                              className="outlineLegendIcon"
                              style={{ borderColor: tag.colourHash, backgroundColor: tag.colourHash + 33 }}
                            />
                            <span className="icon-space">{tag.description}</span>
                          </div>
                        )}
                      </div>
                    }
                  </label>
                </div>
            )}
          </div>
          <style jsx>{`
            .boundaries-container {
              margin-top: 0.75rem;
            }
            .boundary-spinner {
              margin-right: 30px;
            }
            .layer-categories {
              padding-left: 0.5em
            }
            .layer-categories :global(.dropdown) {
              margin-bottom: 0.5em;
            }
            .icon-space {
              padding-left: 0.2em;
              padding-right: 0.2em;
            }
          `}</style>
        </CardBody>
      </MapToolCard>
    </MapTool>
  )
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaryLayer) => boundaryLayer.toJS())

const mapStateToProps = (state) => ({
  boundaryLayers: getBoundaryLayersList(state),
  mapZoomChanged: state.map.zoom,
  dataItems: state.plan.dataItems,
  mapLayers: state.mapLayers.angularMapLayers,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  appConfiguration: objectHasLength(state.toolbar.appConfiguration)
    && state.toolbar.appConfiguration,
  selectedLibraryItems: objectHasLength(state.plan.dataItems)
    && state.plan.dataItems.service_layer.selectedLibraryItems,
})

const mapDispatchToProps = (dispatch) => ({
  setBoundaryLayers: boundaryLayers => dispatch(MapLayerActions.setBoundaryLayers(boundaryLayers)),
  setMapSelection: mapSelection => dispatch(SelectionActions.setMapSelection(mapSelection)),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  updateLayerVisibility: (layer, isVisible) => {
    // First set the visibility of the current layer
    dispatch(MapLayerActions.setLayerVisibility(layer, isVisible))
  },
  loadEntityList: (entityType, filterObj, select, searchColumn, configuration) => dispatch(
    StateViewModeActions.loadEntityList(entityType, filterObj, select, searchColumn, configuration)
  ),
})

export default connect(mapStateToProps, mapDispatchToProps)(BoundariesPanel)
