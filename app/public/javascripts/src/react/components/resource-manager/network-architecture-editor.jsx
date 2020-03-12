import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { getFormValues } from 'redux-form'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import NetworkArchitecture from './network-architecture-form.jsx'
import Constants from '../../common/constants'
import ResourceManagerActions from './resource-manager-actions'
const planningConstraintsSelector = getFormValues(Constants.NETWORK_ARCHITECTURE)

export class NetworkArchitectureEditor extends Component {
  render () {
    return (
      <div>
        <div className='modal-header ng-isolate-scope' title={this.props.resourceManagerName}>
          <h5 className='modal-title ng-binding ng-scope'>{this.props.resourceManagerName}</h5>
          <button type='button' className='close ng-scope' data-dismiss='modal' aria-label='Close'>
            <span aria-hidden='true'>×</span>
          </button>
        </div>
        <div className='modal-body' style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'scroll' }}>
          <NetworkArchitecture initialValues={this.props.definition} enableReinitialize />
        </div>
        <div className='modal-footer'>
          <button className='btn btn-primary float-right' onClick={() => this.props.onDiscard()}>Discard changes</button>
          <button className='btn btn-primary float-right' onClick={() => this.saveSettings()}>Save</button>
        </div>
      </div>
    )
  }

  saveSettings () {
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, this.props.modifiedNetworkArchitecture)
    this.props.onDiscard()
  }
}

NetworkArchitectureEditor.propTypes = {
  // onDiscard: PropTypes.func
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  modifiedNetworkArchitecture: planningConstraintsSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition))
})

const NetworkArchitectureEditorComponent = wrapComponentWithProvider(reduxStore, NetworkArchitectureEditor, mapStateToProps, mapDispatchToProps)
export default NetworkArchitectureEditorComponent
