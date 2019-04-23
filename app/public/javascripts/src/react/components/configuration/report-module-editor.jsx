import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { formValueSelector } from 'redux-form'
import ConfigurationActions from './configuration-actions'
import ReportDefinitionEditor from './report-definition-editor.jsx'
import Constants from '../../common/constants'
import './report-module-editor.css'
const selector = formValueSelector(Constants.REPORT_DEFINITION_EDITOR_FORM)

export class ReportModuleEditor extends Component {
  constructor (props) {
    super(props)
    this.props.populateEditingReportDefinition(this.props.reportBeingEdited.id)
    this.state = {
      isEditingPrimary: true,
      subDefinitionEditingIndex: -1,
      validationMessage: null
    }
  }

  getDefinitionBeingEdited () {
    if (!this.props.reportBeingEdited.moduleDefinition) {
      return null
    } else {
      return this.state.isEditingPrimary
        ? this.props.reportBeingEdited.moduleDefinition.definition
        : this.props.reportBeingEdited.moduleDefinition.subDefinitions[this.state.subDefinitionEditingIndex]
    }
  }

  getEditingKey () {
    return this.state.isEditingPrimary ? 'PRIMARY' : this.state.subDefinitionEditingIndex
  }

  render () {
    return <div className='container report-module-editor' style={{ height: '100%' }}>
      <div className='row' style={{ height: '100%' }}>
        <div className='col-md-3'>
          <label>Report Type</label>
          <select className='form-control mb-3' value={this.props.reportBeingEdited.reportType}
            onChange={event => this.props.saveEditingReportType(event.target.value)}>
            <option value='GENERAL'>General</option>
            <option value='COVERAGE'>Coverage</option>
            <option value='FORM477'>Form477</option>
            <option value='PARAM_QUERY'>Param Query</option>
          </select>
          <label>Report Definitions</label>
          <ul className='nav nav-pills'>
            <li className='nav-item' key='-1'>
              <a id='lnkEditPrimaryDefinition'
                className={`nav-link ${this.state.isEditingPrimary ? 'active' : ''}`}
                onClick={() => this.startEditingPrimaryDefinition()}>
                  Primary Definition
              </a>
            </li>
            {
              this.props.reportBeingEdited.moduleDefinition
                ? this.props.reportBeingEdited.moduleDefinition.subDefinitions.map((subDefinition, index) => (
                  <li className='nav-item' key={index}>
                    <a id={`lnkEditSubDefinition${index}`}
                      className={`nav-link subdefinition-link ${this.state.subDefinitionEditingIndex === index ? 'active' : ''}`}
                      onClick={() => this.startEditingSubDefinition(index)}>
                      Subdefinition
                      <button className='btn btn-sm btn-danger ml-1 subdefinition-delete-button'
                        onClick={event => this.props.removeEditingReportSubDefinition(index)}>
                        <i className='fas fa-trash-alt' />
                      </button>
                    </a>
                  </li>
                ))
                : null
            }
          </ul>
          <button className='btn btn-light float-right' onClick={event => this.props.addEditingReportSubDefinition()}>
            <i className='fa fa-plus' /> Add Subdefinition
          </button>
        </div>
        <div className='col-md-9 d-flex flex-column' style={{ height: '100%' }}>
          { this.getDefinitionBeingEdited()
            ? <div className='flex-grow-1'>
              <ReportDefinitionEditor initialValues={this.getDefinitionBeingEdited()} enableReinitialize />
            </div>
            : null
          }
          {/* Show an alert if required */}
          { this.renderValidationAlert() }
          <div className='form-row flex-grow-0' style={{ justifyContent: 'flex-end' }}>
            <button id='btnSaveCurrentDefinition' className='btn btn-light' onClick={event => {
              this.saveCurrentDefinition()
              this.props.validateReport(this.props.planId)
            }}>Check Syntax</button>
            <button id='btnSaveReportToServer' className='btn btn-primary' onClick={event => {
              this.saveCurrentDefinition()
              this.props.saveCurrentReportToServer()
            }}>Save Definition</button>
          </div>
        </div>
      </div>
    </div>
  }

  renderValidationAlert () {
    if (!this.props.reportValidation) {
      return null
    }
    var alertClass, alertMessage
    if (this.props.reportValidation.validated) {
      alertClass = 'alert alert-success'
      alertMessage = 'The report definition was successfully validated without any errors.'
    } else {
      alertClass = 'alert alert-danger'
      alertMessage = this.props.reportValidation.errorMessage
    }
    return <div className='form-row flex-grow-0' style={{ width: '100%' }}>
      <div className='col'>
        <div className={alertClass} role='alert' style={{ width: '100%' }}>
          {alertMessage}
        </div>
      </div>
    </div>
  }

  saveCurrentDefinition () {
    if (this.props.reportDefinitionEditorValues) {
      this.state.isEditingPrimary
        ? this.props.saveEditingReportPrimaryDefinition(this.props.reportDefinitionEditorValues)
        : this.props.saveEditingReportSubDefinition(this.props.reportDefinitionEditorValues, this.state.subDefinitionEditingIndex)
    }
  }

  startEditingPrimaryDefinition () {
    this.saveCurrentDefinition()
    this.setState({
      isEditingPrimary: true,
      subDefinitionEditingIndex: -1
    })
  }

  startEditingSubDefinition (index) {
    this.saveCurrentDefinition()
    this.setState({
      isEditingPrimary: false,
      subDefinitionEditingIndex: index
    })
  }

  componentWillUnmount () {
    this.props.clearEditingReportDefinition()
  }
}

ReportModuleEditor.propTypes = {
  planId: PropTypes.number,
  reportValidation: PropTypes.object,
  reportBeingEdited: PropTypes.object,
  reportDefinitionEditorValues: PropTypes.object
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  reportValidation: state.configuration.reports.validation,
  reportBeingEdited: state.configuration.reports.reportBeingEdited,
  reportDefinitionEditorValues: selector(state, 'name', 'displayName', 'queryType', 'query')
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  populateEditingReportDefinition: reportId => dispatch(ConfigurationActions.populateEditingReportDefinition(reportId)),
  clearEditingReportDefinition: () => dispatch(ConfigurationActions.clearEditingReportDefinition()),
  saveEditingReportPrimaryDefinition: reportDefinition => dispatch(ConfigurationActions.saveEditingReportPrimaryDefinition(reportDefinition)),
  saveEditingReportType: reportType => dispatch(ConfigurationActions.saveEditingReportType(reportType)),
  saveEditingReportSubDefinition: (subDefinition, subDefinitionIndex) => dispatch(ConfigurationActions.saveEditingReportSubDefinition(subDefinition, subDefinitionIndex)),
  addEditingReportSubDefinition: () => dispatch(ConfigurationActions.addEditingReportSubDefinition()),
  removeEditingReportSubDefinition: subDefinitionIndex => dispatch(ConfigurationActions.removeEditingReportSubDefinition(subDefinitionIndex)),
  saveCurrentReportToServer: () => dispatch(ConfigurationActions.saveCurrentReportToServer()),
  validateReport: planId => dispatch(ConfigurationActions.validateReport(planId))
})

const ReportModuleEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ReportModuleEditor)
export default ReportModuleEditorComponent
