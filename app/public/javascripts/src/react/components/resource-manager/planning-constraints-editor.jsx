import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { getFormValues } from 'redux-form'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanningConstraints from './planning-constraints-form.jsx'
import Constants from '../../common/constants'
import ResourceManagerActions from './resource-manager-actions'
import ResourceActions from '../resource-editor/resource-actions'
const planningConstraintsSelector = getFormValues(Constants.PLANNING_CONSTRAINTS_FORM)

export class PlanningConstraintsEditor extends Component {
  componentDidMount () {
    this.props.setModalTitle(this.props.resourceManagerName);  
  }

  render () {
    return (
      <div>
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{flex: '1 1 auto'}}>
            <PlanningConstraints initialValues={this.props.definition} enableReinitialize />
          </div>
          <div style={{flex: '0 0 auto'}}>
            <div style={{textAlign: 'right'}}>
              <button className='btn btn-light mr-2' onClick={() => this.props.onDiscard()}>
                <i className="fa fa-undo action-button-icon"></i>Discard changes
              </button>
              <button className='btn btn-primary' onClick={() => this.saveSettings()}>
                <i className="fa fa-save action-button-icon"></i>Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  saveSettings () {
    this.props.saveResourceManagerDefinition(this.props.editingManager.id, this.props.editingManager.type, this.props.modifiedPlanningConstraints)
    this.props.onDiscard()
  }
}

PlanningConstraintsEditor.propTypes = {
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  modifiedPlanningConstraints: planningConstraintsSelector(state)
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
})

const PlanningConstraintsEditorComponent = wrapComponentWithProvider(reduxStore, PlanningConstraintsEditor, mapStateToProps, mapDispatchToProps)
export default PlanningConstraintsEditorComponent
