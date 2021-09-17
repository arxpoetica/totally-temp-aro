import React, { useState } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import { viewModePanels } from '../../constants'
import EquipmentDetailList from './equipment-detail-list.jsx'
import SelectionActions from '../../../selection/selection-actions'
import ToolBarActions from '../../../header/tool-bar-actions'
import  AroHttp from '../../../../common/aro-http'
import RxState from '../../../../common/rxState'

const EquipmentDetailView = Object.freeze({
  List: 0,
  Detail: 1,
  Fiber: 2
})

const rxState = new RxState()

export const equipmentDetail = (props) => {

  const [state, setState] = useState({
    currentEquipmentDetailView: EquipmentDetailView.List,
    selectedEquipmentGeog: [],
    headerIcon: '',
    networkNodeLabel: ''
  })

  const { currentEquipmentDetailView, selectedEquipmentGeog, headerIcon, networkNodeLabel } = state
  const { activeViewModePanel, plan, cloneSelection, setMapSelection, loggedInUser, networkEquipment,
    activeViewModePanelAction } = props

  const viewSelectedEquipment = (selectedEquipment, isZoom) => {
    var objectId = selectedEquipment.objectId || selectedEquipment.object_id
    updateSelectedState(selectedEquipment)
    displayEquipment(plan.id, objectId).then((equipmentInfo) => {
      if (typeof equipmentInfo !== 'undefined') {
        const mapObject = {
          latitude: selectedEquipmentGeog[1] || 20.5937,
          longitude: selectedEquipmentGeog[0] || 78.9629,
        }
        const ZOOM_FOR_EQUIPMENT_SEARCH = 14
        rxState.requestSetMapCenter.sendMessage(mapObject)
        isZoom && rxState.requestSetMapZoom.sendMessage(ZOOM_FOR_EQUIPMENT_SEARCH)
      }
      // this.checkForBounds(objectId)
    })
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
    // this.coverageOutput = null
    // this.showCoverageOutput = false
	  return AroHttp.get(`/service/plan-feature/${planId}/equipment/${objectId}?userId=${loggedInUser.id}`)
      .then((result) => {
        const equipmentInfo = {"dataType":"equipment","objectId":"568c42b3-0189-4c73-84e4-c36b06b02885","geometry":{"type":"Point","coordinates":[-122.350346,47.587277999999976]},"attributes":{},"networkNodeType":"bulk_distribution_terminal","subtypeId":null,"networkNodeEquipment":{"existingEquipment":[],"plannedEquipment":[{"equipmentTypeCategoryId":6,"equipmentItemId":24,"quantity":1.0,"constructionCost":0.0,"installCost":0.0,"rank":1,"equipmentName":"drop_coil","subComponents":[],"oneTimeCost":false}]},"subnetId":null,"deploymentType":"PLANNED","exportedAttributes":{}}
        if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')) {
          if (networkEquipment.equipments.hasOwnProperty(equipmentInfo.networkNodeType)) {
            setState((state) => ({ ...state,
              headerIcon: networkEquipment.equipments[equipmentInfo.networkNodeType].iconUrl,
              networkNodeLabel: networkEquipment.equipments[equipmentInfo.networkNodeType].label
            }))
          } else {
            // no icon
            setState((state) => ({ ...state,
              headerIcon: '', networkNodeLabel: equipmentInfo.networkNodeType
            }))
          }

          // this.equipmentData = equipmentInfo

          // this.networkNodeType = equipmentInfo.networkNodeType

          // this.equipmentFeature = AroFeatureFactory.createObject(equipmentInfo).networkNodeEquipment
          // this.currentEquipmentDetailView = this.EquipmentDetailView.Detail

          setState((state) => ({ ...state, selectedEquipmentGeog: equipmentInfo.geometry.coordinates }))
          activeViewModePanelAction(viewModePanels.EQUIPMENT_INFO)
        } else {
          // this.clearSelection()
        }
        return equipmentInfo
      }).catch((err) => {
        console.error(err)
      })
  }

  return (
    <div className="ei-panel">
      {
        currentEquipmentDetailView === EquipmentDetailView.List &&
          <div className="ei-panel-header clearfix">
          {
            headerIcon != ''  &&
            <img className="ei-panel-header-icon" src={headerIcon} alt="Equipment Icon"/>
          }
          <div className="ei-panel-header-title">{networkNodeLabel}</div>
          <div className="sidebar-header-subinfo">
            <div className="sidebar-header-subinfo-item">lat: {selectedEquipmentGeog[1]}</div>
            <div className="sidebar-header-subinfo-item">long: {selectedEquipmentGeog[0]}</div>
          </div>
        </div>
      }
      <div className="equipment-detail ei-panel-content">
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
})

const mapDispatchToProps = (dispatch) => ({
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
})

export default wrapComponentWithProvider(reduxStore, equipmentDetail, mapStateToProps, mapDispatchToProps)
