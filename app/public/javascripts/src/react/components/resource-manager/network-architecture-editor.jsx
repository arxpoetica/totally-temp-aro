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
    return <div className='p-5'>
      <h3>{this.props.name}</h3>
      <NetworkArchitecture initialValues={this.props.definition} enableReinitialize />
      <button className='btn btn-primary float-right' onClick={() => this.saveSettings()}>Save</button>
    </div>
  }

  saveSettings () {
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, this.props.modifiedNetworkArchitecture)
  }
}

NetworkArchitectureEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  name: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].name,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  modifiedNetworkArchitecture: planningConstraintsSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition))
})

const NetworkArchitectureEditorComponent = wrapComponentWithProvider(reduxStore, NetworkArchitectureEditor, mapStateToProps, mapDispatchToProps)
export default NetworkArchitectureEditorComponent
