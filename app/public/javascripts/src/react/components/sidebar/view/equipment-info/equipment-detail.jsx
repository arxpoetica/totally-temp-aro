import React, { useState } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import { viewModePanels } from '../../constants'
import EquipmentDetailList from './equipment-detail-list.jsx'

const EquipmentDetailView = Object.freeze({
  List: 0,
  Detail: 1,
  Fiber: 2
})

export const equipmentDetail = (props) => {

  const [state, setState] = useState({
    currentEquipmentDetailView: EquipmentDetailView.List,
  })

  const { currentEquipmentDetailView } = state
  const { activeViewModePanel } = props

  return (
    <div className="ei-panel">
      <div className="equipment-detail ei-panel-content">
        <div className="ei-panel-header-title">Equipment List</div>
        {
          currentEquipmentDetailView === EquipmentDetailView.List && activeViewModePanel === viewModePanels.EQUIPMENT_INFO &&
          <div className="equipment-list">
            <EquipmentDetailList />
          </div>
        }

      </div>
    </div>
  )
}

const mapStateToProps = (state) => ({
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
})

const mapDispatchToProps = (dispatch) => ({
})

export default wrapComponentWithProvider(reduxStore, equipmentDetail, mapStateToProps, mapDispatchToProps)
