import React, { useState, useRef, useEffect } from 'react'
import { createSelector } from 'reselect'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import AroSearch from '../view/aro-search.jsx'
import AroHttp from '../../../common/aro-http'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import ToolBarActions from '../../header/tool-bar-actions'
import SelectionActions from '../../selection/selection-actions'
import { viewModePanels, entityTypeCons, boundryTypeCons, mapHitFeatures } from '../constants'

const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const intlNumberFormat = config.intl_number_format || 'en-US'
const numberFormatter = new Intl.NumberFormat(intlNumberFormat)

export const BoundaryDetail = (props) => {

  const { boundaries, activeViewModePanel, plan, loadEntityList, activeViewModePanelAction,
    selectedMapFeatures, allowViewModeClickAction, cloneSelection, setMapSelection, layerCategories } = props

  const [selectedBoundaryType, setSelectedBoundaryType] = useState('')
  const [entityType, setEntityType] = useState('')
  const [searchColumn, setSearchColumn] = useState('')
  const [configuration, setConfiguration] = useState('')
  const [selectedBoundaryInfo, setSelectedBoundaryInfo] = useState(null)
  const [selectedSAInfo, setSelectedSAInfo] = useState(null)
  const [selectedAnalysisAreaInfo, setSelectedAnalysisAreaInfo] = useState(null)
  const [selectedBoundaryTags, setSelectedBoundaryTags] = useState([])
  const [toggleOtherAttributes, setToggleOtherAttributes] = useState(false)

  // https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect
  function usePrevious(value) {
    const ref = useRef()
    useEffect(() => {
      ref.current = value
    })
    return ref.current
  }

  const prevMapFeatures = usePrevious(selectedMapFeatures)

  useEffect(() => {
    if (!_.isEqual(prevMapFeatures, selectedMapFeatures)) {
      // 160712271: On click of equipment or location dont show boundary details
      if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.EQUIPMENT_FEATURES)
        && selectedMapFeatures.equipmentFeatures.length > 0) return
      if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.LOCATIONS)
        && selectedMapFeatures.locations.length > 0) return
      if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.FIBER_FEATURES)
        && selectedMapFeatures.fiberFeatures.size > 0) return
      if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.ROAD_SEGMENTS)
        && selectedMapFeatures.roadSegments.size > 0) return

      // In ruler mode click should not enable boundary view action
      if (allowViewModeClickAction()) {
        if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.CENSUS_FEATURES)
          && selectedMapFeatures.censusFeatures.length > 0
          && selectedMapFeatures.censusFeatures[0].hasOwnProperty('id')) {
          const tagList = []
          const tags = selectedMapFeatures.censusFeatures[0].tags
          for (const key in tags) {
            if (tags.hasOwnProperty(key)) {
              const tag = {}
              tag.layerCatDescription = layerCategories[key].description
              tag.tagInfo = layerCategories[key].tags[tags[key]]
              tagList.push(tag)
            }
          }
          setSelectedBoundaryTags(tagList)
          const censusBlockId = selectedMapFeatures.censusFeatures[0].id
          const newSelection = cloneSelection()
          newSelection.details.censusBlockId = censusBlockId
          setMapSelection(newSelection)
          viewCensusBlockInfo(censusBlockId)
          setBoundryType(boundryTypeCons.CENSUS_BLOCKS)
        } else if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.SERVICE_AREAS)
            && selectedMapFeatures.serviceAreas.length > 0
            && selectedMapFeatures.serviceAreas[0].hasOwnProperty('code')) {
          viewServiceAreaInfo(selectedMapFeatures.serviceAreas[0])
          const newSelection = cloneSelection()
          newSelection.details.serviceAreaId = selectedMapFeatures.serviceAreas[0].id
          setMapSelection(newSelection)
          setBoundryType(boundryTypeCons.WIRECENTER)
        } else if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.ANALYSIS_AREAS)
            && selectedMapFeatures.analysisAreas.length > 0
            && selectedMapFeatures.analysisAreas[0].hasOwnProperty('code')
            && selectedMapFeatures.analysisAreas[0].hasOwnProperty('_data_type')) {
          viewAnalysisAreaInfo(selectedMapFeatures.analysisAreas[0])
          const newSelection = cloneSelection()
          newSelection.details.analysisAreaId = selectedMapFeatures.analysisAreas[0].id
          setMapSelection(newSelection)
          setBoundryType(boundryTypeCons.ANALYSIS_LAYER)
        }
      }
    }
  }, [selectedMapFeatures])

  const onChangeBoundaryType = (event) => {
    const { value } = event.target
    const filteredBoundry = boundaries.filter(item => item.type === value)[0]
    setSelectedBoundaryType(filteredBoundry)
    setBoundryType(value)
    clearBoundariesDetails()
  }

  const clearBoundariesDetails = () => {
    clearBoundariesInfo()
  }

  const clearBoundariesInfo = () => {
    setSelectedBoundaryInfo(null)
    setSelectedSAInfo(null)
    setSelectedAnalysisAreaInfo(null)
  }

  const setBoundryType = (boundaryLayerType) => {
    if (boundaryLayerType) {
      if (boundaryLayerType === boundryTypeCons.CENSUS_BLOCKS) {
        setEntityType(entityTypeCons.CENSUS_BLOCKS_ENTITY)
        setSearchColumn('id,tabblockId')
        setConfiguration('tabblockId')
      }
      if (boundaryLayerType === boundryTypeCons.WIRECENTER) {
        setEntityType(entityTypeCons.SERVICE_AREA_VIEW)
        setSearchColumn('id,code,name,centroid')
        setConfiguration('code')
      }
      if (boundaryLayerType === boundryTypeCons.ANALYSIS_LAYER) {
        setEntityType(entityTypeCons.ANALYSIS_AREA)
        setSearchColumn('id,code,centroid')
        setConfiguration('code')
      }
    }
  }

  const viewServiceAreaInfo = (serviceArea) => {
    setSelectedBoundaryInfo(null)
    setSelectedAnalysisAreaInfo(null)
    loadEntityList(entityTypeCons.SERVICE_AREA_VIEW, serviceArea.id, 'id,code,name', 'id')
      .then((serviceAreaInfos) => {
        setSelectedSAInfo(serviceAreaInfos[0])
      })
      .catch(err => console.error(err))
    viewBoundaryInfo()
  }


  const viewAnalysisAreaInfo = (analysisArea) => {
    setSelectedBoundaryInfo(null)
    setSelectedSAInfo(null)
    getAnalysisAreaInfo(analysisArea.id)
      .then((analysisAreaInfo) => {
        setSelectedAnalysisAreaInfo(analysisAreaInfo)
      })
    viewBoundaryInfo()
  }

  const getAnalysisAreaInfo = (analysisAreaId) => {
    return loadEntityList(entityTypeCons.ANALYSIS_AREA, analysisAreaId, 'id,code', 'id')
      .then((analysisAreaInfo) => {
        return analysisAreaInfo[0]
      })
  }

  const getCensusBlockInfo = (cbId) => {
    let censusBlockInfo = null
    return AroHttp.get('/census_blocks/' + cbId + '/details')
      .then((response) => {
        censusBlockInfo = response.data
        setSelectedSAInfo(null)
        setSelectedAnalysisAreaInfo(null)
        viewBoundaryInfo()
        return AroHttp.get(`/service/plan-query/${plan.id}/censusBlockCounts?census-block-ids=${censusBlockInfo.id}`)
      })
      .then((response) => {
        censusBlockInfo.locationCount = response.data
        setSelectedBoundaryInfo(censusBlockInfo)
        return censusBlockInfo
      })
  }

  const viewCensusBlockInfo = (censusBlockId) => {
    return getCensusBlockInfo(censusBlockId)
  }

  const viewSelectedBoundary = (selectedBoundary) => {
    const visibleBoundaryLayer = selectedBoundaryType
    if (visibleBoundaryLayer && visibleBoundaryLayer.type === boundryTypeCons.CENSUS_BLOCKS) {
      const newSelection = cloneSelection()
      newSelection.details.censusBlockId = selectedBoundary.id
      setMapSelection(newSelection)
      viewCensusBlockInfo(selectedBoundary.id)
        .then((response) => {
          map.setCenter({ lat: response.centroid.coordinates[1], lng: response.centroid.coordinates[0] })
          const ZOOM_FOR_LOCATION_SEARCH = 14
          const mapObject = {
            latitude: response.centroid.coordinates[1],
            longitude: response.centroid.coordinates[0],
            zoom: ZOOM_FOR_LOCATION_SEARCH,
          }
          const event = new CustomEvent('mapChanged', { detail: mapObject})
          window.dispatchEvent(event)
        })
    } else if (visibleBoundaryLayer && visibleBoundaryLayer.type === boundryTypeCons.WIRECENTER) {
      selectedBoundary.centroid && map.setCenter({ lat: selectedBoundary.centroid.coordinates[1], lng: selectedBoundary.centroid.coordinates[0] })
      const newSelection = cloneSelection()
      newSelection.details.serviceAreaId = selectedBoundary.id
      setMapSelection(newSelection)
      viewServiceAreaInfo(selectedBoundary)
    } else if (visibleBoundaryLayer && visibleBoundaryLayer.type === boundryTypeCons.ANALYSIS_LAYER) {
      selectedBoundary.centroid && map.setCenter({ lat: selectedBoundary.centroid.coordinates[1], lng: selectedBoundary.centroid.coordinates[0] })
      const newSelection = cloneSelection()
      newSelection.details.analysisAreaId = selectedBoundary.id
      setMapSelection(newSelection)
      viewAnalysisAreaInfo(selectedBoundary)
    }
  }

  const viewBoundaryInfo = () => {
    activeViewModePanelAction(viewModePanels.BOUNDARIES_INFO)
  }

  const onClickToggleOtherAttributes = () => {
    setToggleOtherAttributes(!toggleOtherAttributes)
  }

  return (
    <>
      <div className="mb-2 mt-2">
        {/* Boundary Search */}
        <div className="form-group" style={{ display: 'table', width: '100%' }}>
          <div className="col" style={{ display: 'table-cell', verticalAlign: 'bottom'}}>
            <label>Boundary Search:</label>
          </div>
          <div className="col" style={{ display: 'table-cell', verticalAlign: 'middle' }}>
            <select
              value={selectedBoundaryType.type}
              className="form-control-sm"
              onChange={(event) => onChangeBoundaryType(event)}
            >
              <option value="" hidden>Select a boundary type for search</option>
              {
                boundaries.filter((item) => item.checked === true).map((item, index) =>
                  <option key={index} value={item.type} label={item.description} />
                )
              }
            </select>
          </div>
        </div>

        {/* Aro Search */}
        {
          activeViewModePanel === viewModePanels.BOUNDARIES_INFO &&
          <AroSearch
            objectName="Boundary Layer"
            labelId="code"
            entityType={entityType}
            searchColumn={searchColumn}
            configuration={configuration}
            onSelectedBoundary={viewSelectedBoundary}
          />
        }
      </div>

      {/* Census Block info */}
      {
        selectedBoundaryInfo !== null &&
        <div className="boundary-detail">
          <div>Census Block Code: {selectedBoundaryInfo.tabblock_id}</div>
          <div>Area(sq. miles): {(selectedBoundaryInfo.area_meters / (1609.34 * 1609.34)).toFixed(2)}</div>
          <div>Area(acres): {(selectedBoundaryInfo.area_meters / 4046.86).toFixed(2)}</div>
          <div>Area(sq. meters): {numberFormatter.format((selectedBoundaryInfo.area_meters).toFixed(2))}</div>
          <div>Centroid Latitude: {(selectedBoundaryInfo.centroid.coordinates[1]).toFixed(5)}</div>
          <div>Centroid Longitude: {(selectedBoundaryInfo.centroid.coordinates[0]).toFixed(5)}</div>
          {
            selectedBoundaryTags && selectedBoundaryTags.map((tag, index) => {
              return (
                undefined !== tag.tagInfo &&
                <div key={index}>
                  {tag.layerCatDescription} :
                  <div
                    classname="outlineLegendIcon"
                    style={{borderColor: `${tag.tagInfo.colourHash}`, backgroundColor: `${tag.tagInfo.colourHash}33`}}
                  />
                    {tag.tagInfo.description}
                </div>
              )
            })
          }
          {
            selectedBoundaryInfo.locationCount && selectedBoundaryInfo.locationCount.length > 0
              && selectedBoundaryInfo.locationCount.map((locationCountInfo, index) => {
                return (
                  <div key={index}>
                    <span className="capitalize">
                      {locationCountInfo.locationCategory}</span>: {locationCountInfo.houseHoldCount}
                  </div>
                )
              })
          }

          {/* other Attributes */}
          <div style={{width: '100%', marginTop: '2px', marginBottom: '6px'}}>
            <div className="ei-header" style={{paddingTop: '0px',}} onClick={onClickToggleOtherAttributes}>
              {
                !toggleOtherAttributes
                  ? <i className="far fa-plus-square ei-foldout-icon"></i>
                  : <i className="far fa-minus-square ei-foldout-icon"></i>
              }
              Other Attributes
            </div>
            {
              toggleOtherAttributes && activeViewModePanel === viewModePanels.BOUNDARIES_INFO &&
              <span>
                <div className="table-wrapper-scroll-y">
                  <table className="table table-sm table-striped">
                    <tbody>
                      {
                        selectedBoundaryInfo.attributes
                        && Object.entries(selectedBoundaryInfo.attributes).map(([key, value]) => {
                          return (
                            <tr>
                              <td>{ key }</td>
                              <td>{ value }</td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </span>
            }
          </div>
        </div>
      }

      {/* Service Area info */}
      {
        selectedSAInfo !== null &&
        <div className="boundary-detail">
          <div>Code: {selectedSAInfo.code}</div>
          <div>Name: {selectedSAInfo.name}</div>
        </div>
      }

      {/* Analysis Area info */}
      {
        selectedAnalysisAreaInfo !== null &&
        <div className="boundary-detail">
          <div>Name: {selectedAnalysisAreaInfo.code}</div>
        </div>
      }

    </>
  )
}

const mapStateToProps = (state) => ({
  boundaries: getBoundaryLayersList(state),
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  plan: state.plan.activePlan,
  selectedMapFeatures: state.selection.mapFeatures,
  layerCategories: state.stateViewMode.layerCategories,
})

const mapDispatchToProps = (dispatch) => ({
  loadEntityList: (entityType, filterObj, select, searchColumn, configuration) => dispatch(
    StateViewModeActions.loadEntityList(entityType, filterObj, select, searchColumn, configuration)
  ),
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  allowViewModeClickAction: () => dispatch(StateViewModeActions.allowViewModeClickAction()),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
})

const BoundaryDetailComponent = wrapComponentWithProvider(
  reduxStore, BoundaryDetail, mapStateToProps, mapDispatchToProps
)
export default BoundaryDetailComponent
