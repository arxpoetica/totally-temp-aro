import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import DraggableNode from './draggable-node.jsx'
import { constants } from './shared'

export const EquipmentDragger = props => {

  const { activePlan, perspective, mapLayers } = props
  const [editableEquipmentTypes, setEditableEquipmentTypes] = useState([])
  const [equipmentDefinitions, setEquipmentDefinitions] = useState({})

  useEffect(() => {
    let { planType } = activePlan
    let constructionPlanType = planType
    if (!(planType in perspective.networkEquipment.planEdit)) planType = 'default'
    if (!(constructionPlanType in perspective.constructionAreas.planEdit)) constructionPlanType = 'default'
    const definitions = {
      ...mapLayers.networkEquipment.equipments,
      ...mapLayers.constructionAreas.construction_areas,
    }

    setEquipmentDefinitions(definitions)
    const networkNodeTypes = Object.keys(definitions)

    const visibleEquipmentTypes = perspective && perspective.networkEquipment.planEdit[planType].areAddable || []
    const visibleEdgeConstructionTypes = perspective && perspective.constructionAreas.planEdit[constructionPlanType].areAddable || []
    const visibleTypes = [...visibleEquipmentTypes, ...visibleEdgeConstructionTypes]

    const editableEquipmentTypes = visibleTypes.filter(type => {
      return networkNodeTypes.includes(type)
    })
    setEditableEquipmentTypes(editableEquipmentTypes)
  }, [])

  return Object.keys(equipmentDefinitions).length > 0 && (
    <div className="equipment-dragger">
      <div className="info">
        (drag icon onto map)
      </div>
      <div className="nodes">
        {editableEquipmentTypes.map(type => equipmentDefinitions[type] &&
          <DraggableNode
            key={type}
            icon={equipmentDefinitions[type].iconUrl}
            entityType={constants.DRAG_DROP_NETWORK_EQUIPMENT}
            entityDetails={equipmentDefinitions[type].networkNodeType}
            label={equipmentDefinitions[type].label}
          />
        )}
      </div>
    </div>
  ) || null

}

const mapStateToProps = (state) => {
  return {
    activePlan: state.plan.activePlan,
    perspective: state.configuration.ui.perspective,
    mapLayers: state.mapLayers,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
