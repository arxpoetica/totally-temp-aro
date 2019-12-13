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
    return <div className='p-5'>
      <h3>{this.props.name}</h3>
      <PlanningConstraints initialValues={this.props.definition} enableReinitialize />
      <button className='btn btn-primary float-right' onClick={() => this.saveSettings()}>Save</button>
    </div>
  }

  saveSettings () {
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, this.props.modifiedPlanningConstraints)
  }
}

PlanningConstraintsEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  name: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].name,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  modifiedPlanningConstraints: planningConstraintsSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition))
})

const PlanningConstraintsEditorComponent = wrapComponentWithProvider(reduxStore, PlanningConstraintsEditor, mapStateToProps, mapDispatchToProps)
export default PlanningConstraintsEditorComponent
