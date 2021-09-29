import React, { useState, useEffect } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import { viewModePanels } from '../../constants'
import BoundaryCoverage from './boundary-coverage.jsx'
import EquipmentDetailList from './equipment-detail-list.jsx'
import SelectionActions from '../../../selection/selection-actions'
import ToolBarActions from '../../../header/tool-bar-actions'
import StateViewModeActions from '../../../state-view-mode/state-view-mode-actions'
import  AroHttp from '../../../../common/aro-http'
import RxState from '../../../../common/rxState'
import AroSearch from '../../view/aro-search.jsx'
import EquipmentInterfaceTree from './equipment-interface-tree.jsx'
import AroFeatureFactory from '../../../../../service-typegen/dist/AroFeatureFactory'
import { usePrevious } from '../../../../common/view-utils.js'
import { dequal } from 'dequal'
import TileDataService from '../../../../../components/tiles/tile-data-service'

const EquipmentDetailView = Object.freeze({
  List: 0,
  Detail: 1,
  Fiber: 2
})
const tileDataService = new TileDataService()

const rxState = new RxState()

export const equipmentDetail = (props) => {

  const [state, setState] = useState({
    currentEquipmentDetailView: EquipmentDetailView.List,
    selectedEquipmentGeog: [],
    headerIcon: '',
    networkNodeLabel: '',
    boundsObjectId: null,
    showCoverageOutput: false,
    coverageOutput: null,
    equipmentData: null,
    boundsData: null,
    isWorkingOnCoverage: false,
    isComponentDestroyed: false,
    equipmentFeature: {},
    networkNodeType: '',
  })

  const { currentEquipmentDetailView, selectedEquipmentGeog, headerIcon, networkNodeLabel, boundsObjectId,
    showCoverageOutput, coverageOutput, equipmentData, boundsData, isComponentDestroyed, equipmentFeature,
    networkNodeType } = state
  const { activeViewModePanel, plan, cloneSelection, setMapSelection, loggedInUser, networkEquipment,
    activeViewModePanelAction, showSiteBoundary, getOptimizationBody, configuration, selectedMapFeatures,
    allowViewModeClickAction } = props

  const prevMapFeatures = usePrevious(selectedMapFeatures)

  useEffect(() => {
    if (!dequal(prevMapFeatures, selectedMapFeatures)) {
      if(!allowViewModeClickAction) return
      if (selectedMapFeatures.hasOwnProperty('roadSegments')
        && selectedMapFeatures.roadSegments.size > 0) return

      if (selectedMapFeatures.hasOwnProperty('equipmentFeatures') && selectedMapFeatures.equipmentFeatures.length > 0) {
          var equipmentList = getValidEquipmentFeaturesList(selectedMapFeatures.equipmentFeatures) // Filter Deleted equipment features
          if (equipmentList.length > 0) {
            const equipment = equipmentList[0]
            updateSelectedState(equipment)
            displayEquipment(plan.id, equipment.object_id)
            .then((equipmentInfo) => {
              checkForBounds(equipment.object_id)
            })
          }
      }
    }
  }, [selectedMapFeatures])

  const getValidEquipmentFeaturesList = (equipmentFeaturesList) => {
    var validEquipments = []
    equipmentFeaturesList.filter((equipment) => {
      if (tileDataService.modifiedFeatures.hasOwnProperty(equipment.object_id)) {
        if (!tileDataService.modifiedFeatures[equipment.object_id].deleted) validEquipments.push(equipment)
      } else {
        validEquipments.push(equipment)
      }
    })
    return validEquipments
  }

  const updateSelectedState = (selectedFeature) => {
    const newSelection = cloneSelection()
    newSelection.editable.equipment = {}
    newSelection.details.fiberSegments = new Set()
	  if (typeof selectedFeature !== 'undefined') {
      newSelection.editable.equipment[selectedFeature
        .object_id || selectedFeature.objectId] = selectedFeature
    }
    setMapSelection(newSelection)
  }

  const displayEquipment = (planId, objectId) => {
    setState((state) => ({ ...state, coverageOutput: null, showCoverageOutput: false }))
	  return AroHttp.get(`/service/plan-feature/${planId}/equipment/${objectId}?userId=${loggedInUser.id}`)
      .then((result) => {
        const equipmentInfo = result.data
        if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')) {
          if (networkEquipment.equipments.hasOwnProperty(equipmentInfo.networkNodeType)) {
            setState((state) => ({ ...state,
              headerIcon: networkEquipment.equipments[equipmentInfo.networkNodeType].iconUrl,
              networkNodeLabel: networkEquipment.equipments[equipmentInfo.networkNodeType].label
            }))
          } else {
            // no icon
            setState((state) => ({ ...state,
              headerIcon: '',networkNodeLabel: equipmentInfo.networkNodeType
            }))
          }
          setState((state) => ({ ...state,
            equipmentData: equipmentInfo, 
            selectedEquipmentGeog: equipmentInfo.geometry.coordinates,
            equipmentFeature: AroFeatureFactory.createObject(equipmentInfo).networkNodeEquipment,
            networkNodeType: equipmentInfo.networkNodeType,
            currentEquipmentDetailView: EquipmentDetailView.Detail
          }))
          activeViewModePanelAction(viewModePanels.EQUIPMENT_INFO)
        } else {
          // this.clearSelection()
        }
        return equipmentInfo
      }).catch((err) => {
        console.error(err)
      })
  }

  const viewSelectedEquipment = (selectedEquipment, isZoom) => {
    var objectId = selectedEquipment.objectId || selectedEquipment.object_id
    updateSelectedState(selectedEquipment)
    displayEquipment(plan.id, objectId).then((equipmentInfo) => {
      if (typeof equipmentInfo !== 'undefined') {
        const mapObject = {
          latitude: selectedEquipmentGeog[1],
          longitude: selectedEquipmentGeog[0],
        }
        const ZOOM_FOR_EQUIPMENT_SEARCH = 14
        rxState.requestSetMapCenter.sendMessage(mapObject)
        isZoom && rxState.requestSetMapZoom.sendMessage(ZOOM_FOR_EQUIPMENT_SEARCH)
      }
      checkForBounds(equipmentInfo)
    })
  }

  const checkForBounds = (equipmentInfo) => {
    if (!equipmentInfo.hasOwnProperty('objectId')) {
      setState((state) => ({ ...state, boundsData: null }))
      return
    }
    var equipmentId = equipmentInfo.objectId
    var filter = `rootPlanId eq ${plan.id} and networkNodeObjectId eq guid'${equipmentId}'`
    AroHttp.get(`/service/odata/NetworkBoundaryEntity?$filter=${filter}`)
      .then((result) => {
        if (result.data.length < 1) {
          setState((state) => ({ ...state, boundsObjectId: null, boundsData: null }))
        } else {
          setState((state) => ({ ...state, boundsObjectId: result.data.objectId, boundsData: result.data }))
        }
      })
  }

  const onRequestCalculateCoverage = () => {
    if (equipmentData && boundsData) {
      calculateCoverage(boundsData, equipmentData.geometry)
    }
  }

   // ToDo: very similar function to the one in plan-editor.js combine those
   const calculateCoverage = (boundsData, equipmentPoint, directed) => {
    if (typeof directed === 'undefined') directed = false
    // Get the POST body for optimization based on the current application state
    var optimizationBody = getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.boundaryCalculationType = 'FIXED_POLYGON'
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = equipmentPoint
    optimizationBody.polygon = boundsData.geom
    optimizationBody.directed = directed // directed analysis if thats what the user wants
    setState((state) => ({ ...state, isWorkingOnCoverage: true }))

    AroHttp.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then(result => {
        // // The user may have destroyed the component before we get here. In that case, just return
        if (isComponentDestroyed) {
          return Promise.reject(new Error('Plan editor was closed while a boundary was being calculated'))
        }
        setState((state) => ({ ...state,
          coverageOutput: result.data, 
          showCoverageOutput: true,
          isWorkingOnCoverage: false,
        }))
      })
      .catch((err) => {
        console.error(err)
        setState((state) => ({ ...state, isWorkingOnCoverage: false }))
      })
  }

  return (
    <div className="ei-panel">
      <div className="mb-2 mt-2">
        {
          activeViewModePanel === viewModePanels.EQUIPMENT_INFO &&
          <AroSearch
            objectName="Equipment"
            labelId="clli"
            entityType="NetworkEquipmentEntity"
            select="id,clli,objectId"
            searchColumn="clli"
            configuration={configuration}
            onSelectionChanged={viewSelectedEquipment}
          />
        }
      </div>
      {
        currentEquipmentDetailView === EquipmentDetailView.Detail &&
          <div className="ei-panel-header clearfix">
          {
            headerIcon != ''  &&
            <img className="ei-panel-header-icon" src={headerIcon} alt="Equipment Icon" />
          }
          <div className="ei-panel-header-title">{networkNodeLabel}</div>
          <div className="sidebar-header-subinfo">
            <div className="sidebar-header-subinfo-item">lat: {selectedEquipmentGeog[1]}</div>
            <div className="sidebar-header-subinfo-item">long: {selectedEquipmentGeog[0]}</div>
          </div>
        </div>
      }
      <div className="equipment-detail ei-panel-content">
      {
        currentEquipmentDetailView === EquipmentDetailView.Detail &&
        <>
        <EquipmentInterfaceTree
          objectToView={equipmentFeature}
          rootMetaData={{networkNodeType: networkNodeType}}
          isEdit={false}
          indentationLevel={0}
        />
        {
          boundsObjectId && showSiteBoundary &&
          <div className="equipment-detail-bounds">
            <hr className="equipment-detail-hr" />
            <button className="btn btn-primary btn-sm" onClick={() => onRequestCalculateCoverage()}>
              calculate coverage
            </button>
            {
              showCoverageOutput &&
              <BoundaryCoverage selectedBoundaryCoverage={coverageOutput} />
            }
          </div>
        }
        </>
      }
      <br />
      <div className="ei-panel-header-title">Equipment List</div>
      {
        currentEquipmentDetailView === EquipmentDetailView.List && activeViewModePanel === viewModePanels.EQUIPMENT_INFO &&
        <div className="equipment-list">
          <EquipmentDetailList onClickObject={viewSelectedEquipment}/>
        </div>
      }
      </div>
    </div>
  )
}

const mapStateToProps = (state) => ({
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  plan: state.plan.activePlan,
  networkEquipment: state.mapLayers.networkEquipment,
  loggedInUser: state.user.loggedInUser,
  showSiteBoundary: state.mapLayers.showSiteBoundary,
  configuration: state.toolbar.appConfiguration,
  selectedMapFeatures: state.selection.mapFeatures,
})

const mapDispatchToProps = (dispatch) => ({
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
  getOptimizationBody: () => dispatch(StateViewModeActions.getOptimizationBody()),
  allowViewModeClickAction: () => dispatch(StateViewModeActions.allowViewModeClickAction()),
})

export default wrapComponentWithProvider(reduxStore, equipmentDetail, mapStateToProps, mapDispatchToProps)
