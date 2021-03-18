import React, { useState } from 'react'
import { createSelector } from 'reselect'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import AroSearch from '../view/aro-search.jsx'
import AroHttp from '../../../common/aro-http'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import ToolBarActions from '../../header/tool-bar-actions'

const getAllBoundaryLayers = state => state.mapLayers.boundary
const getBoundaryLayersList = createSelector([getAllBoundaryLayers], (boundaries) => boundaries.toJS())

const intlNumberFormat = config.intl_number_format || 'en-US'
const numberFormatter = new Intl.NumberFormat(intlNumberFormat)

export const BoundaryDetail = ({ boundaries, activeViewModePanel, plan, loadEntityList, activeViewModePanelAction }) => {

  const [selectedBoundaryType, setSelectedBoundaryType] = useState('')
  const [entityType, setEntityType] = useState('')
  const [searchColumn, setSearchColumn] = useState('')
  const [configuration, setConfiguration] = useState('')
  const [selectedBoundaryInfo, setSelectedBoundaryInfo] = useState(null)
  const [selectedSAInfo, setSelectedSAInfo] = useState(null)
  const [selectedAnalysisAreaInfo, setSelectedAnalysisAreaInfo] = useState(null)

  const onChangeBoundaryType = (event) => {
    const { value } = event.target
    setSelectedBoundaryType(value)
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
      if (boundaryLayerType === 'census_blocks') {
        setEntityType('CensusBlocksEntity')
        setSearchColumn('id,tabblockId')
        setConfiguration('tabblockId')
      }
      if (boundaryLayerType === 'wirecenter') {
        setEntityType('ServiceAreaView')
        setSearchColumn('id,code,name,centroid')
        setConfiguration('code')
      }
      if (boundaryLayerType === 'analysis_layer') {
        setEntityType('AnalysisArea')
        setSearchColumn('id,code,centroid')
        setConfiguration('code')
      }
    }
  }

  const viewServiceAreaInfo = (serviceArea) => {
    setSelectedBoundaryInfo(null)
    setSelectedAnalysisAreaInfo(null)
    loadEntityList('ServiceAreaView', serviceArea.id, 'id,code,name', 'id')
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
    return loadEntityList('AnalysisArea', analysisAreaId, 'id,code', 'id')
      .then((analysisAreaInfo) => {
        return analysisAreaInfo[0]
      })
  }

  const getCensusBlockInfo = (cbId) => {
    var censusBlockInfo = null
    return AroHttp.get('/census_blocks/' + cbId + '/details')
      .then((response) => {
        censusBlockInfo = response.data
        return AroHttp.get(`/service/plan-query/${plan.id}/censusBlockCounts?census-block-ids=${censusBlockInfo.id}`)
      })
      .then((response) => {
        censusBlockInfo.locationCount = response.data
        return censusBlockInfo
      })
  }

  const viewCensusBlockInfo = (censusBlockId) => {
    return getCensusBlockInfo(censusBlockId).then((cbInfo) => {
      setSelectedSAInfo(null)
      setSelectedAnalysisAreaInfo(null)
      setSelectedBoundaryInfo(cbInfo)
      viewBoundaryInfo()
    })
  }

  const viewSelectedBoundary = (selectedBoundary) => {
    var visibleBoundaryLayer = selectedBoundaryType
    if (visibleBoundaryLayer === 'census_blocks') {
      viewCensusBlockInfo(selectedBoundary.id)
        .then((response) => {
          map.setCenter({ lat: response.centroid.coordinates[1], lng: response.centroid.coordinates[0] })
        })
    } else if (visibleBoundaryLayer === 'wirecenter') {
      map.setCenter({ lat: selectedBoundary.centroid.coordinates[1], lng: selectedBoundary.centroid.coordinates[0] })
      viewServiceAreaInfo(selectedBoundary)
    } else if (visibleBoundaryLayer === 'analysis_layer') {
      map.setCenter({ lat: selectedBoundary.centroid.coordinates[1], lng: selectedBoundary.centroid.coordinates[0] })
      viewAnalysisAreaInfo(selectedBoundary)
    }
  }

  const viewBoundaryInfo = () => {
    activeViewModePanelAction('BOUNDARIES_INFO')
  }

  return (
    <>
    <div className="mb-2 mt-2">
      <div className="form-group" style={{ display:'table', width:'100%' }}>
        <div className="col" style={{ display: 'table-cell', verticalAlign: 'bottom'}}>
          <label>Boundary Search:</label>
        </div>
        <div className="col" style={{ display: 'table-cell', verticalAlign: 'middle' }}>
          <select
            value={selectedBoundaryType}
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
      {
        activeViewModePanel === 'BOUNDARIES_INFO' &&
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

      {
        selectedBoundaryInfo !== null &&
        <div className="boundary-detail">
          <div>Census Block Code: {selectedBoundaryInfo.tabblock_id}</div>
          <div>Area(sq. miles): {numberFormatter.format((selectedBoundaryInfo.area_meters / (1609.34 * 1609.34).toFixed(2)))}</div>
          <div>Area(acres): {numberFormatter.format((selectedBoundaryInfo.area_meters / 4046.86).toFixed(2))}</div>
          <div>Area(sq. meters): {numberFormatter.format((selectedBoundaryInfo.area_meters).toFixed(2))}</div>
          <div>Centroid Latitude: {numberFormatter.format((selectedBoundaryInfo.centroid.coordinates[1]).toFixed(5))}</div>
          <div>Centroid Longitude: {numberFormatter.format((selectedBoundaryInfo.centroid.coordinates[0]).toFixed(5))}</div>
        </div>
      }

      {
        selectedSAInfo !== null &&
        <div className="boundary-detail">
          <div>Code: {selectedSAInfo.code}</div>
          <div>Name: {selectedSAInfo.name}</div>
        </div>
      }

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
})

const mapDispatchToProps = (dispatch) => ({
  loadEntityList: (entityType, filterObj, select, searchColumn, configuration) => dispatch(
    StateViewModeActions.loadEntityList(entityType, filterObj, select, searchColumn, configuration)
  ),
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
})

const BoundaryDetailComponent = wrapComponentWithProvider(
  reduxStore, BoundaryDetail, mapStateToProps, mapDispatchToProps
)
export default BoundaryDetailComponent
