import React, { useEffect, useState, useContext } from 'react'
import { connect } from 'react-redux'
import { MapToolIcon } from '../map-tool-icon.jsx'
import { CardHeader } from '../card-header.jsx'
import { MapToolCard } from '../map-tool-card.jsx'
import { CardBody } from '../card-body.jsx'
import MapTool from '../map-tool.jsx'
import { MapToolContext } from '../map-display-tools.jsx'
import Select from 'react-select'
import AroHttp from '../../../common/aro-http'
import { getRandomColors } from '../../../common/view-utils'
import { klona } from 'klona'

// Competition display
const competitionData = {
  allCompetitorTypes: [
    {
      id: 'retail',
      label: 'Retail'
    },
    {
      id: 'wholesale',
      label: 'Wholesale'
    },
    {
      id: 'tower',
      label: 'Cell Towers'
    }
  ],
  selectedCompetitorType: '',
  allCompetitors: [],
  selectedCompetitors: [],
  useAllCompetitors: false,
  useNBMDataSource: true,
  useGeotelDataSource: false,
  speedThreshold: 100,
  showCensusBlocks: true,
  showFiberRoutes: false,
  showFiberRoutesBuffer: false,
  allRenderingOptions: [
    {
      label: 'Presence',
      alphaRender: false
    },
    {
      label: 'Competitive Strength',
      aggregate: {
        individual: {
          'census-block': {
            aggregateById: 'gid',
            aggregateProperty: 'strength'
          },
          'census-block-group': {
            aggregateById: 'cbg_id',
            aggregateProperty: 'strength'
          }
        },
        all: {
          'census-block': {
            aggregateById: 'gid',
            aggregateProperty: 'sum_strength'
          },
          'census-block-group': {
            aggregateById: 'cbg_id',
            aggregateProperty: 'sum_strength'
          }
        }
      }
    },
    {
      label: 'Speed Intensity',
      alphaRender: true,
      alphaThresholdProperty: 'download_speed',
      aggregate: {
        individual: {
          'census-block': {
            aggregateById: 'gid',
            aggregateProperty: 'download_speed'
          },
          'census-block-group': {
            aggregateById: 'cbg_id',
            aggregateProperty: 'download_speed'
          }
        },
        all: {
          'census-block': {
            aggregateById: 'gid',
            aggregateProperty: 'max_download'
          },
          'census-block-group': {
            aggregateById: 'cbg_id',
            aggregateProperty: 'max_download'
          }
        }
      }
    }
  ],
  selectedRenderingOption: ''
}

const square = (color) => ({
  alignItems: 'center',
  display: 'flex',
  ':before': {
    backgroundColor: color,
    content: '" "',
    display: 'block',
    margin: 5,
    height: 10,
    width: 10,
  },
})

const customStyles = {
  control: styles => ({ ...styles, backgroundColor: 'white', marginTop: 5 }),
  menuList: styles => {
    return {
      ...styles,
      maxHeight: 150,
    }
  },
  multiValue: (styles, state) => ({
    ...styles,
    ...square(state.data.fillStyle),
  }),
}

const createdMapLayerKeys = new Set()
const { location: { protocol, hostname, port } } = window
const baseUrl = `${protocol}//${hostname}:${port}`

const CompetitionPanel = (props) => {

  const { mapToolState, globalMethods, dispatch } = useContext(MapToolContext)
  const { visible, disabled, collapsed } = mapToolState
  const { MapToolActions, isMapToolExpanded, isMapToolVisible } = globalMethods

  const [competition, setCompetition] = useState(competitionData)
  const [minAggregatedValue, setMinAggregatedValue] = useState(0.0)
  const [maxAggregatedValue, setMaxAggregatedValue] = useState(1.0)
  const [showBlockHeatMap, setShowBlockHeatMap] = useState(false)

  const {
    mapToolName,
    competitorNetworks,
    competitionManager,
    mapLayers,
    zoom,
    defaultPlanCoordinates,
  } = props

  useEffect(() => {
    // Select the first entry in the list
    competition.selectedCompetitorType = competition.allCompetitorTypes[0].id
    competition.selectedRenderingOption = competition.allRenderingOptions[0]
    setCompetition(competition)
    reloadCompetitors()
  }, [])

  useEffect(() => {
    updateMapLayers()
  }, [zoom, defaultPlanCoordinates, minAggregatedValue, maxAggregatedValue, showBlockHeatMap])

  const formatCompetitorsData = (allCompetitorsData) => {
    return allCompetitorsData.map((allCompetitors) => {
      return { ...allCompetitors, label: allCompetitors.name, value: allCompetitors.name }
    })
  }

  const onCompetitorTypeChanged = (event) => {
    const { value } = event.target
    competition.selectedCompetitorType = value
    setCompetition(klona(competition))
  }

  const onUseAllCompetitorsChanged = () => {
    competition.useAllCompetitors = !competition.useAllCompetitors
    if (competition.useAllCompetitors) {
      competition.selectedCompetitors = []
    }
    setCompetition(klona(competition))
    updateMapLayers()
  }

  const onCompetitorsChanged = (event) => {
    competition.selectedCompetitors = event !== null ? event : []
    setCompetition(klona(competition))
    updateMapLayers()
  }

  const reloadCompetitors = async() => {
    try {
      const response = await AroHttp.get(`/competitors/v1/competitors/carriers/${competition.selectedCompetitorType}`)
      if (response.status >= 200 && response.status <= 299) {
        const filterData = response.data.sort((a, b) => a.name.localeCompare(b.name))
        competition.allCompetitors = formatCompetitorsData(filterData)
        // For now just populate random colors for each competitor. This can later come from the api.
        for (let iCompetitor = 0; iCompetitor < competition.allCompetitors.length; ++iCompetitor) {
          const randomColors = getRandomColors()
          competition.allCompetitors[iCompetitor].strokeStyle = randomColors.strokeStyle
          competition.allCompetitors[iCompetitor].fillStyle = randomColors.fillStyle
        }
        setCompetition(klona(competition))
      }
    } catch (err) {
      console.log(err)
    }
  }

  const onDataSourceChanged = (event) => {
    const { name } = event.target
    competition[name] = !competition[name]
    setCompetition(klona(competition))
    updateMapLayers()
  }

  const onRenderingChanged = (event) => {
    const { value } = event.target
    const selectedRenderingOption = competition.allRenderingOptions.filter((item) => item.label === value)[0]
    competition.selectedRenderingOption = selectedRenderingOption
    setCompetition(klona(competition))
    updateMapLayers()
  }

  const updateMapLayers = () => {
    // We need a competition resource manager selected before we can update any layers
    const selectedCompetitionResourceManager = competitionManager && competitionManager.selectedManager
    if (!selectedCompetitionResourceManager) {
      console.warn('The user attempted to show competitor networks, but a competition resource manager has not been selected yet. Skipping...')
      return
    }

    // Make a copy of the state mapLayers. We will update this
    const oldMapLayers = { ...mapLayers.getValue() }

    // Remove all the map layers previously created by this controller
    createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    createdMapLayerKeys.clear()

    // Add map layers based on the selection
    const mapLayerKey = 'competitor_censusBlocks'
    const polyTransform = map.getZoom() > 5 ? 'select' : 'smooth'
    const lineTransform = map.getZoom() > 10 ? 'select' : 'smooth_absolute'
    let dataSource = null
    if (competition.useNBMDataSource && competition.useGeotelDataSource) {
      dataSource = 'nbm_geotel'
    } else if (competition.useNBMDataSource) {
      dataSource = 'nbm'
    } else if (competition.useGeotelDataSource) {
      dataSource = 'geotel'
    }

    createLayersForCensusBlocks(mapLayerKey, dataSource, oldMapLayers, createdMapLayerKeys)
    createLayersForFiber(mapLayerKey, lineTransform, oldMapLayers, createdMapLayerKeys)
    createLayersForFiberBuffer(mapLayerKey, lineTransform, polyTransform, oldMapLayers, createdMapLayerKeys)
    mapLayers.next(oldMapLayers)
  }

  const createLayersForCensusBlocks = (mapLayerKey, dataSource, oldMapLayers, createdMapLayerKeys) => {
    const censusBlockTileDefinitions = []
    const CENSUS_BLOCK_ZOOM_THRESHOLD = 11
    const blockType = map.getZoom() > CENSUS_BLOCK_ZOOM_THRESHOLD ? 'census-block' : 'census-block-group'
    const providerType = competition.selectedCompetitorType
    const polyTransform = map.getZoom() > 5 ? 'select' : 'smooth'
    const selectedCompetitionResourceManager = competitionManager && competitionManager.selectedManager

    if (competition.showCensusBlocks && dataSource) {
      let aggregateOptionsType = null; let cbStrokeStyle = null; let cbFillStyle = null
      if (competition.useAllCompetitors) {
        // Our endpoint uses "all competitors"
        const strengthDescriptor = (blockType === 'census-block') ? 'cb-strength' : 'cbg-strength'
        const cbTileDefinition = {
          dataId: `v1.competitive.${dataSource}.${providerType}.${strengthDescriptor}.tiles.poly.${polyTransform}.${selectedCompetitionResourceManager.id}`,
          vtlType: (blockType === 'census-block') ? 'CompetitiveCBPolyLayer' : 'CompetitiveCBGPolyLayer',
          strengthResourceManagerId: selectedCompetitionResourceManager.id,
          networkDataSource: dataSource,
          providerType,
          transform: polyTransform
        }
        censusBlockTileDefinitions.push(cbTileDefinition)
        aggregateOptionsType = 'all'
        cbStrokeStyle = '#000000'
        cbFillStyle = '#505050'
      } else {
        // We want to use only the selected competitors
        competition.selectedCompetitors.forEach((selectedCompetitor) => {
          const carrierId = selectedCompetitor.id
          const cbTileDefinition = {
            dataId: `v1.competitive-carrier.${dataSource}.${carrierId}.${blockType}.tiles.${providerType}.${polyTransform}.${selectedCompetitionResourceManager.id}`,
            vtlType: (blockType === 'census-block') ? 'CompetitiveCBProviderLayer' : 'CompetitiveCBGProviderLayer',
            strengthResourceManagerId: selectedCompetitionResourceManager.id,
            networkDataSource: dataSource,
            carrierId,
            providerType,
            transform: polyTransform
          }
          censusBlockTileDefinitions.push(cbTileDefinition)
        })
        aggregateOptionsType = 'individual'
        if (competition.selectedCompetitors.length > 0) {
          cbStrokeStyle = competition.selectedCompetitors[0].strokeStyle
          cbFillStyle = competition.selectedCompetitors[0].fillStyle
        }
      }

      if (censusBlockTileDefinitions.length > 0) {
        const mapLayer = {
          tileDefinitions: censusBlockTileDefinitions,
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: cbStrokeStyle,
          fillStyle: cbFillStyle,
          zIndex: 1041,
          opacity: 0.6
        }

        // Set aggregation options
        if (competition.selectedRenderingOption.aggregate) {
          mapLayer.aggregateMode = 'BY_ID'
          mapLayer.aggregateById = competition.selectedRenderingOption.aggregate[aggregateOptionsType][blockType].aggregateById,
          mapLayer.aggregateProperty = competition.selectedRenderingOption.aggregate[aggregateOptionsType][blockType].aggregateProperty

          // Make sure min/max aggregated values are correct
          const minAggregated = Math.min(minAggregatedValue, 0.99)
          let maxAggregated = Math.max(0.01, maxAggregatedValue)
          if (maxAggregated < minAggregated) {
            maxAggregated = minAggregated + 0.01
            setMaxAggregatedValue(maxAggregated)
          }
          mapLayer.aggregateMinPalette = minAggregated
          mapLayer.aggregateMaxPalette = maxAggregated
          mapLayer.renderMode = showBlockHeatMap ? 'AGGREGATE_GRADIENT' : 'AGGREGATE_OPACITY'
        } else {
          mapLayer.aggregateMode = 'FLATTEN'
          mapLayer.renderMode = 'PRIMITIVE_FEATURES'
        }

        oldMapLayers[mapLayerKey] = mapLayer
        createdMapLayerKeys.add(mapLayerKey)
      }
    }
  }

  // Create map layers for fiber
  const createLayersForFiber = (mapLayerKey, lineTransform, oldMapLayers, createdMapLayerKeys) => {
    // Create fiber routes layer
    if (competition.showFiberRoutes) {
      const fiberLineWidth = 2
      const providerType = competition.selectedCompetitorType
      if (competition.useAllCompetitors) {
        const fiberTileDefinition = {
          dataId: `v1.tiles.fiber.competitive.all.line.${lineTransform}`,
          vtlType: 'CompetitiveAllFiberLayer',
          lineTransform
        }
        const mapLayerKey = 'competitor_fiberRoutes_all'
        oldMapLayers[mapLayerKey] = {
          tileDefinitions: [fiberTileDefinition],
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          drawingOptions: {
            strokeStyle: '#000000',
            fillStyle: '#000000',
            lineWidth: fiberLineWidth
          },
          zIndex: 1042
        }
        createdMapLayerKeys.add(mapLayerKey)
      } else {
        competition.selectedCompetitors.forEach((selectedCompetitor) => {
          const fiberTileDefinition = {
            dataId: `v1.tiles.fiber.competitive.carrier.line.${selectedCompetitor.id}.${lineTransform}`,
            vtlType: 'CompetitiveFiberLayer',
            lineTransform,
            carrierId: selectedCompetitor.id
          }
          const mapLayerKey = `competitor_fiberRoutes_${providerType}_${selectedCompetitor.id}`
          oldMapLayers[mapLayerKey] = {
            tileDefinitions: [fiberTileDefinition],
            iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
            drawingOptions: {
              strokeStyle: selectedCompetitor.strokeStyle,
              fillStyle: selectedCompetitor.fillStyle,
              lineWidth: fiberLineWidth
            },
            zIndex: 1043,
          }
          createdMapLayerKeys.add(mapLayerKey)
        })
      }
    }
  }

  const createLayersForFiberBuffer = (mapLayerKey, lineTransform, polyTransform, oldMapLayers, createdMapLayerKeys) => {
    // Create fiber routes buffer layer.
    if (competition.showFiberRoutesBuffer) {
      const providerType = competition.selectedCompetitorType
      if (competition.useAllCompetitors) {
        const allFiberBufferTileDefinition = {
          dataId: `v1.tiles.fiber.competitive.buffer.all.buffer.${polyTransform}`,
          vtlType: 'CompetitiveAllFiberBufferLayer',
          lineTransform
        }
        const mapLayerKey = 'competitor_fiberRoutesBuffer_all'
        oldMapLayers[mapLayerKey] = {
          tileDefinitions: [allFiberBufferTileDefinition],
          iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
          strokeStyle: '#000000',
          zIndex: 1044,
          fillStyle: '#000000'
        }
        createdMapLayerKeys.add(mapLayerKey)
      } else {
        competition.selectedCompetitors.forEach((selectedCompetitor) => {
          const fiberBufferTileDefinition = {
            dataId: `v1.tiles.fiber.competitive.carrier.buffer.${selectedCompetitor.id}.${polyTransform}`,
            vtlType: 'CompetitiveFiberBufferLayer',
            carrierId: selectedCompetitor.id,
            polyTransform
          }
          const mapLayerKey = `competitor_fiberRoutesBuffer_${providerType}_${selectedCompetitor.id}`
          oldMapLayers[mapLayerKey] = {
            tileDefinitions: [fiberBufferTileDefinition],
            iconUrl: `${baseUrl}/images/map_icons/aro/businesses_small_default.png`,
            strokeStyle: selectedCompetitor.strokeStyle,
            fillStyle: selectedCompetitor.fillStyle,
            zIndex: 1045,
            opacity: 0.4
          }
          createdMapLayerKeys.add(mapLayerKey)
        })
      }
    }
  }

  const setMenuPlacement = () => {
    return competition.selectedCompetitors &&
      competition.selectedCompetitors.length >= 5 ? 'top' : 'bottom'
  }

  return (
    <MapTool className="competition">
      <MapToolIcon
        handleClick={() =>
          dispatch({ type: MapToolActions.MAP_SET_TOGGLE_MAP_TOOL, payload: mapToolName })
        }
        toolId="fiber_plant"
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
          <div className="competition-map-tool">
            <div className="line-break" />
            <form>
              {competitorNetworks.showCompetitorTypes &&
                <>
                  <p><strong>Competitor Types</strong></p>
                  <select
                    className='form-control'
                    value={competition.selectedCompetitorType}
                    onChange={event => onCompetitorTypeChanged(event)}
                  >
                    {competition.allCompetitorTypes.map((item) =>
                      <option value={item.id} key={item.id}>{item.label}</option>
                    )}
                  </select>
                </>
              }

              <div className="line-break" />
              <p><strong>Competitors</strong></p>
              <input type="checkbox" className="checkboxfill"
                checked={competition.useAllCompetitors}
                onChange={event => onUseAllCompetitorsChanged(event)}
              /> Use All Competitors

              <Select
                isMulti
                value={competition.selectedCompetitors}
                options={competition.allCompetitors}
                closeMenuOnSelect={true}
                hideSelectedOptions={true}
                backspaceRemovesValue={true}
                isSearchable={true}
                isClearable={false}
                isDisabled={competition.useAllCompetitors}
                placeholder="Select data sources..."
                onChange={event => onCompetitorsChanged(event)}
                styles={customStyles}
                menuPlacement={setMenuPlacement()}
                components={{ DropdownIndicator: null }}
              />

              <div className="line-break" />
              <p><strong>Survey Data</strong></p>
              <input
                name="useNBMDataSource"
                type="checkbox"
                className="checkboxfill"
                checked={competition.useNBMDataSource}
                onChange={event => onDataSourceChanged(event)}
              />
              {competitorNetworks.fiberPlantLabel}&nbsp;
              <input
                name="useGeotelDataSource"
                type="checkbox"
                className="checkboxfill"
                checked={competition.useGeotelDataSource}
                onChange={event => onDataSourceChanged(event)}
              /> Geotel

              <div className="line-break" />
              <p><strong>Survey Data</strong></p>
              <input
                name="showCensusBlocks"
                type="checkbox"
                className="checkboxfill"
                checked={competition.showCensusBlocks}
                onChange={event => onDataSourceChanged(event)}
              />
              Census Blocks

              <div className="line-break" />
              <p><strong>Fiber Route Data</strong></p>
              <input
                name="showFiberRoutes"
                type="checkbox"
                className="checkboxfill"
                checked={competition.showFiberRoutes}
                onChange={event => onDataSourceChanged(event)}
              />
              Routes&nbsp;

              <input
                name="showFiberRoutesBuffer"
                type="checkbox"
                className="checkboxfill"
                checked={competition.showFiberRoutesBuffer}
                onChange={event => onDataSourceChanged(event)}
              />
              Routes Buffer

              <div className="line-break" />
              <p><strong>Rendering</strong></p>
              <select
                className='form-control'
                value={competition.selectedRenderingOption.label}
                onChange={event => onRenderingChanged(event)}
              >
                {competition.allRenderingOptions.map((item, index) => 
                  <option value={item.label} key={index}>{item.label}</option>
                )}
              </select>

              {/* to test different rendering options */}
              <p>
                <input
                  type="checkbox"
                  className="checkboxfill"
                  checked={showBlockHeatMap}
                  onChange={() => setShowBlockHeatMap(!showBlockHeatMap)}
                />
                Show heatmap
              </p>

              <p>Minimum aggregated value</p>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={minAggregatedValue}
                onChange={(event) => setMinAggregatedValue(event.target.value)}
              />

              <p>Maximum aggregated value</p>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={maxAggregatedValue}
                onChange={(event) => setMaxAggregatedValue(event.target.value)}
              />

            </form>
          </div>
          <style jsx>{`
            .line-break {
              margin-top: 1.2em;
            }
            .competition-map-tool input {
              margin-right: 0.5em;
            }
            .competition-map-tool select {
              margin-bottom: 0.2em;
            } 
          `}</style>
        </CardBody>
      </MapToolCard>
    </MapTool>
  )
}

const mapStateToProps = (state) => ({
  mapTools: state.map.map_tools,
  map: state.map,
  mapReadyPromise: state.mapLayers.mapReadyPromise,
  competitorNetworks: Object.keys(state.toolbar.appConfiguration).length
    && state.toolbar.appConfiguration.perspective.competitorNetworks,
  competitionManager: state.plan.resourceItems.competition_manager,
  mapLayers: state.mapLayers.angularMapLayers,
  zoom: state.map.zoom,
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates,
})

export default connect(mapStateToProps, null)(CompetitionPanel)
