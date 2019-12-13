import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { getFormValues } from 'redux-form'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import FusionConstraints from './fusion-editor-form.jsx'
import Constants from '../../common/constants'
import ResourceManagerActions from './resource-manager-actions'
const fusionSelector = getFormValues(Constants.FUSION_FORM)

export class FusionEditor extends Component {
  render () {
    return <div className='p-5' style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <h3>{this.props.editingManager && this.props.editingManager.name}</h3>
      <FusionConstraints initialValues={this.props.config} enableReinitialize />
      <button className='btn btn-primary float-right' onClick={() => this.saveSettings()}>Save</button>
    </div>
  }

  saveSettings () {
    // Compile all the forms into a definition

    // this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, this.props.modifiedPlanningConstraints)
  }
}

FusionEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  config: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition.config,
  modifiedFusion: fusionSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition))
})

const FusionEditorComponent = wrapComponentWithProvider(reduxStore, FusionEditor, mapStateToProps, mapDispatchToProps)
export default FusionEditorComponent
