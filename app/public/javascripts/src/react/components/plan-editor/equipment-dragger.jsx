import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import DraggableButton from './draggable-button.jsx'
import Constants from './constants'

// TODO: centralize these somewhere...should probably not be hardcoded
const editableNetworkNodeTypes = [
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

export const EquipmentDragger = props => {

  const { visibleEquipmentTypes, equipmentDefinitions } = props

  const [selectedEquipmentType, setSelectedEquipmentType] = useState(null)
  const [editableEquipmentTypes, setEditableEquipmentTypes] = useState([])

  useEffect(() => {
    const editableEquipmentTypes = visibleEquipmentTypes.filter(type => editableNetworkNodeTypes.includes(type))
    setEditableEquipmentTypes(editableEquipmentTypes)
    setSelectedEquipmentType(editableEquipmentTypes[0])
  }, [])

  return equipmentDefinitions && equipmentDefinitions[selectedEquipmentType] && (
    <div className='d-flex flex-row' style={{ alignItems: 'center' }}>
      {/* The button that will be dragged onto the map */}
      <DraggableButton
        className='flex-grow-0 m-3'
        key={selectedEquipmentType}
        icon={equipmentDefinitions[selectedEquipmentType].iconUrl}
        entityType={Constants.DRAG_DROP_NETWORK_EQUIPMENT}
        entityDetails={equipmentDefinitions[selectedEquipmentType].networkNodeType}
        isBoundary={false}
      />

      {/* A dropdown to select the equipment type to drag */}
      <select
        className='flex-grow-1 m-2 form-control'
        value={selectedEquipmentType}
        onChange={event => setSelectedEquipmentType(event.target.value)}
      >
        {
          editableEquipmentTypes.map(type => {
            <option key={type} value={type}>
              {equipmentDefinitions[type].label}
            </option>
          })
        }
      </select>

      {/* Help text */}
      <div className='flex-shrink-0 m-3'>
        (drag icon onto map)
      </div>
    </div>
  ) || null

}

EquipmentDragger.propTypes = {
  visibleEquipmentTypes: PropTypes.arrayOf(PropTypes.string),
  equipmentDefinitions: PropTypes.object,
}

const mapStateToProps = (state) => ({
  visibleEquipmentTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.networkEquipment.areVisible) || [],
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments,
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
