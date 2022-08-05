import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import DraggableNode from './draggable-node.jsx'
import { constants } from './shared'
import PlanEditorSelectors from './plan-editor-selectors'

export const EquipmentDragger = props => {

  const { planType, drafts, selectedSubnetId, equipmentDraggerInfo, visibleEquipmentTypes } = props
  const { equipmentDefinitions } = equipmentDraggerInfo

  // ugh, special casing...
  const displayTypes =
    planType === 'UNDEFINED' && !Object.keys(drafts).length && !selectedSubnetId
    ? ['central_office']
    : visibleEquipmentTypes

  return displayTypes.length > 0 && (
    <div className="equipment-dragger">
      <div className="info">
        (drag icon onto map)
      </div>
      <div className="nodes">
        {displayTypes.map(type => equipmentDefinitions[type] &&
          <DraggableNode
            key={type}
            icon={equipmentDefinitions[type].iconUrl}
            entityType={constants.DRAG_DROP_NETWORK_EQUIPMENT}
            entityDetails={equipmentDefinitions[type].networkNodeType}
            label={equipmentDefinitions[type].label}
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
  ) || null

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
