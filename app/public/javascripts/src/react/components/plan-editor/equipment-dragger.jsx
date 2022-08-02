import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import DraggableNode from './draggable-node.jsx'
import { constants } from './shared'

export const EquipmentDragger = props => {

  const { activePlan, perspective, mapLayers, features, selectedSubnetId } = props
  const [visibleEquipmentTypes, setVisibleEquipmentTypes] = useState([])


  let { planType } = activePlan
  let constructionPlanType = planType
  if (!(planType in perspective.networkEquipment.planEdit)) planType = 'default'
  if (!(constructionPlanType in perspective.constructionAreas.planEdit)) constructionPlanType = 'default'
  const equipmentDefinitions = {
    ...mapLayers.networkEquipment.equipments,
    ...mapLayers.constructionAreas.construction_areas,
  }
  const addableEquipmentTypes = perspective && perspective.networkEquipment.planEdit[planType].areAddable || []
  const addableEdgeConstructionTypes = perspective && perspective.constructionAreas.planEdit[constructionPlanType].areAddable || []
  const addableTypes = [...addableEquipmentTypes, ...addableEdgeConstructionTypes]

  useEffect(() => {
    if (selectedSubnetId) {
      const { networkNodeType } = features[selectedSubnetId].feature
      const visibleEquipmentTypes = addableTypes.filter(type => {
        return equipmentDefinitions[networkNodeType].allowedChildEquipment.includes(type)
      })
      setVisibleEquipmentTypes(visibleEquipmentTypes)
    } else {
      setVisibleEquipmentTypes([])
    }
  }, [selectedSubnetId])

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
    activePlan: state.plan.activePlan,
    perspective: state.configuration.ui.perspective,
    mapLayers: state.mapLayers,
    features: state.planEditor.features,
    selectedSubnetId: state.planEditor.selectedSubnetId,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
