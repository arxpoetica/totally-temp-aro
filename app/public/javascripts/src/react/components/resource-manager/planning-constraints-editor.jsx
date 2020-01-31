import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { getFormValues } from 'redux-form'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanningConstraints from './planning-constraints-form.jsx'
import Constants from '../../common/constants'
import ResourceManagerActions from './resource-manager-actions'
const planningConstraintsSelector = getFormValues(Constants.PLANNING_CONSTRAINTS_FORM)

export class PlanningConstraintsEditor extends Component {
  render () {
    return (
      <div>
        <div className='modal-header ng-isolate-scope' title='Your File Name Here'>
          <h5 className='modal-title ng-binding ng-scope'>Your File Name Here</h5>
          <button type='button' className='close ng-scope' data-dismiss='modal' aria-label='Close'>
            <span aria-hidden='true'>×</span>
          </button>
        </div>
        <div className='modal-body' style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'scroll' }}>
          <PlanningConstraints initialValues={this.props.definition} enableReinitialize />
        </div>
        <div className='modal-footer'>
          <button className='btn btn-primary float-right' onClick={() => this.props.onDiscard()}>Discard changes</button>
          <button className='btn btn-primary float-right' onClick={() => this.saveSettings()}>Save</button>
        </div>
      </div>
    )
  }

  saveSettings () {
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, this.props.modifiedPlanningConstraints)
  }
}

PlanningConstraintsEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  // name: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].name,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  modifiedPlanningConstraints: planningConstraintsSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition))
})

const PlanningConstraintsEditorComponent = wrapComponentWithProvider(reduxStore, PlanningConstraintsEditor, mapStateToProps, mapDispatchToProps)
export default PlanningConstraintsEditorComponent
