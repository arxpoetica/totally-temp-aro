import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import DraggableButton from './draggable-button.jsx'
import Constants from './constants'

export class EquipmentDragger extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedEquipmentType: null
    }
  }

  componentDidMount () {
    this.setState({
      selectedEquipmentType: this.getEditableEquipmentTypes()[0]
    })
  }

  render () {
    const editableEquipmentTypes = this.getEditableEquipmentTypes()
    const selectedEquipmentType = this.state.selectedEquipmentType || editableEquipmentTypes[0]
    return <div>
      <div className='d-flex flex-row' style={{ alignItems: 'center' }}>

        {/* The button that will be dragged onto the map */}
        <DraggableButton
          className='flex-grow-0 m-3'
          key={this.state.selectedEquipmentType}
          icon={this.props.equipmentDefinitions[selectedEquipmentType].iconUrl}
          entityType={Constants.DRAG_DROP_NETWORK_EQUIPMENT}
          entityDetails={this.props.equipmentDefinitions[selectedEquipmentType].networkNodeType}
          isBoundary={false}
        />

        {/* A dropdown to select the equipment type to drag */}
        <select
          className='flex-grow-1 m-2 form-control'
          value={selectedEquipmentType}
          onChange={e => this.setState({ selectedEquipmentType: e.target.value })}
        >
          {
            editableEquipmentTypes.map(editableEquipmentType => <option key={editableEquipmentType} value={editableEquipmentType}>
              {this.props.equipmentDefinitions[editableEquipmentType].label}
            </option>)
          }
        </select>

        {/* Help text */}
        <div className='flex-shrink-0 m-3'>
          (drag icon onto map)
        </div>
      </div>
    </div>
  }

  getEditableEquipmentTypes () {
    const editableNetworkNodeTypes = new Set([
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
