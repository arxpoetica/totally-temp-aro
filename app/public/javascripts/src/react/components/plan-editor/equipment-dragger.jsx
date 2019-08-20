import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import DraggableButton from './draggable-button.jsx'

export class EquipmentDragger extends Component {
  render () {
    const editableEquipmentTypes = this.getEditableEquipmentTypes()
    return <div>
      {
        editableEquipmentTypes.map(editableEquipmentType => (
          <DraggableButton
            key={editableEquipmentType}
            icon={this.props.equipmentDefinitions[editableEquipmentType].iconUrl}
            entityType={'networkEquipment'}
            entityDetails={this.props.equipmentDefinitions[editableEquipmentType].networkNodeType}
            isBoundary={false}
          />
        ))
      }
    </div>
  }

  getEditableEquipmentTypes () {
    const editableNetworkNodeTypes = new Set([
      'central_office',
      'dslam',
      'fiber_distribution_hub',
      'fiber_distribution_terminal',
      'cell_5g',
      'splice_point',
      'bulk_distribution_terminal',
      'loop_extender',
      'network_anchor',
      'multiple_dwelling_unit',
      'network_connector',
      'location_connector'
    ])
    return this.props.visibleEquipmentTypes.filter(equipmentType => editableNetworkNodeTypes.has(equipmentType))
  }
}

EquipmentDragger.propTypes = {
  visibleEquipmentTypes: PropTypes.arrayOf(PropTypes.string),
  equipmentDefinitions: PropTypes.object
}

const mapStateToProps = (state) => ({
  visibleEquipmentTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.networkEquipment.areVisible) || [],
  equipmentDefinitions: state.mapLayers.networkEquipment.equipments
})

const mapDispatchToProps = dispatch => ({
})

const EquipmentDraggerComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentDragger)
export default EquipmentDraggerComponent
