import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import DraggableNode from './draggable-node.jsx'
import { constants } from './shared'
import PlanEditorSelectors from './plan-editor-selectors'

export const EquipmentDragger = props => {

  const { equipmentDraggerInfo, visibleEquipmentTypes } = props
  const { equipmentDefinitions } = equipmentDraggerInfo

  return visibleEquipmentTypes.length > 0 && (
    <div className="equipment-dragger">
      <div className="info">
        (drag icon onto map)
      </div>
      <div className="nodes">
        {visibleEquipmentTypes.map(type => equipmentDefinitions[type] &&
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
    equipmentDraggerInfo: PlanEditorSelectors.getEquipmentDraggerInfo(state),
    visibleEquipmentTypes: state.planEditor.visibleEquipmentTypes,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
