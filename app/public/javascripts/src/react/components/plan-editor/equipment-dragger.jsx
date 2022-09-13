import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import DraggableNode from './draggable-node.jsx'
import { constants } from './shared'
import PlanEditorSelectors from './plan-editor-selectors'

export const EquipmentDragger = props => {

  const { planType, drafts, selectedSubnetId, equipmentDraggerInfo, visibleEquipmentTypes } = props
  const { equipmentDefinitions, addableTypes } = equipmentDraggerInfo

  // ugh, special casing for various scenarios...this could arguably be done better...
  let activeTypes
  const draftsLength = Object.keys(drafts).length
  if (!draftsLength && !selectedSubnetId) {
    activeTypes = planType === 'RING'
      // 1. if ring plan and no drafts or selected subnet id
      ? ['central_office']
      // 2. if greenfield and no pre-existing central office
      : ['central_office', 'fiber_distribution_hub']
  } else {
    // 3. otherwise no special casing, use default from selector
    activeTypes = visibleEquipmentTypes
  }

  return (
    <div className="equipment-dragger">
      <div className="info">
        (drag icon onto map)
      </div>
      <div className="nodes">
        {addableTypes.map(type => equipmentDefinitions[type] &&
          <DraggableNode
            key={type}
            icon={equipmentDefinitions[type].iconUrl}
            entityType={constants.DRAG_DROP_NETWORK_EQUIPMENT}
            entityDetails={equipmentDefinitions[type].networkNodeType}
            label={equipmentDefinitions[type].label}
            active={activeTypes.includes(type)}
          />
        )}
      </div>
      <style jsx>{`
        .equipment-dragger {
          margin: 0 0 10px;
        }
        .info {
          text-align: center;
          margin: 0 0 4px;
        }
        .nodes {
          display: grid;
          gap: 5px;
          grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
          padding: 5px;
          border: 2px solid #f3f3f3;
        }
      `}</style>
    </div>
  )

}

const mapStateToProps = (state) => {
  return {
    planType: state.plan.activePlan.planType,
    drafts: state.planEditor.drafts,
    selectedSubnetId: state.planEditor.selectedSubnetId,
    equipmentDraggerInfo: PlanEditorSelectors.getEquipmentDraggerInfo(state),
    visibleEquipmentTypes: state.planEditor.visibleEquipmentTypes,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
