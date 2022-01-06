import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import DraggableNode from './draggable-node.jsx'
import { constants } from './shared'

// TODO: centralize these somewhere...should probably not be hardcoded
const networkNodeTypes = [
  'dslam',
  'central_office',
  'fiber_distribution_hub',
  'fiber_distribution_terminal',
  'cell_5g',
  'splice_point',
  'bulk_distribution_terminal',
  'loop_extender',
  'network_anchor',
  'multiple_dwelling_unit',
  'network_connector',
  'location_connector',
]

const edgeConstruction = [
  "edge_construction_area"
]

export const EquipmentDragger = props => {

  const { visibleEquipmentTypes, equipmentDefinitions, visibleEdgeConstructionTypes } = props

  const [editableEquipmentTypes, setEditableEquipmentTypes] = useState([])

  useEffect(() => {
    const editableEquipmentTypes = [...visibleEquipmentTypes, ...visibleEdgeConstructionTypes].filter(type => {
      return networkNodeTypes.includes(type) || edgeConstruction.includes(type)
    })
    setEditableEquipmentTypes(editableEquipmentTypes)
  }, [])

  return equipmentDefinitions && (
    <div className="equipment-dragger">

      <div className="info">
        (drag icon onto map)
      </div>

      <div className="nodes">
        {editableEquipmentTypes.map(type =>
          (equipmentDefinitions[type] && <DraggableNode
            key={type}
            icon={equipmentDefinitions[type].iconUrl}
            entityType={constants.DRAG_DROP_NETWORK_EQUIPMENT}
            entityDetails={equipmentDefinitions[type].networkNodeType}
            label={equipmentDefinitions[type].label}
          />)
        )}
      </div>

    </div>
  ) || null

}

EquipmentDragger.propTypes = {
  visibleEquipmentTypes: PropTypes.arrayOf(PropTypes.string),
  equipmentDefinitions: PropTypes.object,
}

const mapStateToProps = (state) => ({
  visibleEquipmentTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.networkEquipment.planEdit.areAddable) || [],
  visibleEdgeConstructionTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.constructionAreas.planEdit.areAddable) || [],
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
