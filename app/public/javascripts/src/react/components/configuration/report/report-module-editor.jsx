import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { formValueSelector, reset } from 'redux-form'
import ReportActions from './report-actions'
import ReportDefinitionEditor from './report-definition-editor.jsx'
import Constants from '../../../common/constants'
import './report-module-editor.css'
const selector = formValueSelector(Constants.REPORT_DEFINITION_EDITOR_FORM)

export class ReportModuleEditor extends Component {
  constructor(props) {
    super(props)
    this.props.populateEditingReportDefinition(this.props.reportBeingEdited.id)
    this.props.populateReportTypes()
    this.state = {
      isEditingPrimary: true,
      subDefinitionEditingIndex: -1,
      validationMessage: null
    }
  }

  getDefinitionBeingEdited() {
    if (!this.props.reportBeingEdited.moduleDefinition) {
      return null
    } else {
      return this.state.isEditingPrimary
        ? this.props.reportBeingEdited.moduleDefinition.definition
        : this.props.reportBeingEdited.moduleDefinition.subDefinitions[this.state.subDefinitionEditingIndex]
    }
  }

  getEditingKey() {
    return this.state.isEditingPrimary ? 'PRIMARY' : this.state.subDefinitionEditingIndex
  }

  render() {
    return <div className='container report-module-editor' style={{ height: '100%' }}>
      <div className='row' style={{ height: '100%' }}>
        <div className='col-md-3'>
          <label>Report Type</label>
          <select className='form-control mb-3' value={this.props.reportBeingEdited.reportType}
            onChange={event => this.props.saveEditingReportType(event.target.value)}>
            {this.props.reportTypes.map(item => <option value={item.name} key={item.name}>{item.description}</option>)}
          </select>
          <label>Report Definitions</label>
          <ul className='nav nav-pills mb-2 definitions-list'>
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
                  <li className='nav-item outside-btn' key={index}>
                    <a id={`lnkEditSubDefinition${index}`}
                      className={`nav-link subdefinition-link ${this.state.subDefinitionEditingIndex === index ? 'active' : ''}`}
                      onClick={() => this.startEditingSubDefinition(index)}>
                      Subdefinition
                    </a>
                    <button
                      className='btn btn-sm ml-1 subdefinition-delete-button'
                      onClick={event => this.props.removeEditingReportSubDefinition(index)}>
                      <i className='fas fa-trash-alt text-danger' />
                    </button>
                  </li>
                ))
                : null
            }
          </ul>
          <button className='btn btn-light btn-sm float-right'
            onClick={event => this.props.addEditingReportSubDefinition()}>
            <i className='fa fa-plus' /> Add Subdefinition
          </button>
        </div>
        <div className='col-md-9 d-flex flex-column' style={{ height: '100%' }}>
          {this.getDefinitionBeingEdited()
            ? <div className='flex-grow-1'>
              <ReportDefinitionEditor initialValues={this.getDefinitionBeingEdited()} enableReinitialize />
            </div>
            : null
          }
          {/* Show an alert if required */}
          {this.renderValidationAlert()}
          <div className='form-row flex-grow-0' style={{ justifyContent: 'flex-end' }}>
            <button id='btnSaveCurrentDefinition' className='btn btn-light' onClick={event => {
              this.saveCurrentDefinition()
              this.props.validateReport(this.props.planId)
            }}>Check Syntax</button>
            <button id='btnSaveReportToServer' className='btn btn-primary' disabled={this.props.formHasErrors}
              onClick={event => {
                this.saveCurrentDefinition()
                this.props.saveCurrentReportToServer()
              }}>Save Definition</button>
          </div>
        </div>
      </div>
    </div>
  }

  renderValidationAlert() {
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

  saveCurrentDefinition() {
    if (this.props.reportDefinitionEditorValues) {
      this.state.isEditingPrimary
        ? this.props.saveEditingReportPrimaryDefinition(this.props.reportDefinitionEditorValues)
        : this.props.saveEditingReportSubDefinition(this.props.reportDefinitionEditorValues, this.state.subDefinitionEditingIndex)
    }
  }

  startEditingPrimaryDefinition() {
    if (this.props.formHasErrors) {
      // Form has errors, cannot change definitions
      return
    }
    this.saveCurrentDefinition()
    this.setState({
      isEditingPrimary: true,
      subDefinitionEditingIndex: -1
    })
  }

  startEditingSubDefinition(index) {
    if (this.props.formHasErrors) {
      // Form has errors, cannot change definitions
      return
    }
    this.saveCurrentDefinition()
    this.setState({
      isEditingPrimary: false,
      subDefinitionEditingIndex: index
    })
  }

  componentWillUnmount() {
    this.props.clearEditingReportDefinition()
    this.props.clearReportTypes()
  }
}

ReportModuleEditor.propTypes = {
  planId: PropTypes.number,
  reportValidation: PropTypes.object,
  reportBeingEdited: PropTypes.object,
  reportDefinitionEditorValues: PropTypes.object,
  reportTypes: PropTypes.array
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  reportValidation: state.configuration.report.validation,
  reportBeingEdited: state.configuration.report.reportBeingEdited,
  reportDefinitionEditorValues: selector(state, 'name', 'displayName', 'queryType', 'query'),
  reportTypes: state.configuration.report.reportTypes,
  formHasErrors: Boolean(state.form[Constants.REPORT_DEFINITION_EDITOR_FORM] && state.form[Constants.REPORT_DEFINITION_EDITOR_FORM].syncErrors)
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  populateEditingReportDefinition: reportId => dispatch(ReportActions.populateEditingReportDefinition(reportId)),
  clearEditingReportDefinition: () => dispatch(ReportActions.clearEditingReportDefinition()),
  populateReportTypes: () => dispatch(ReportActions.getReportTypes()),
  clearReportTypes: () => dispatch(ReportActions.clearReportTypes()),
  saveEditingReportPrimaryDefinition: reportDefinition => {
    dispatch(ReportActions.saveEditingReportPrimaryDefinition(reportDefinition))
    dispatch(reset(Constants.REPORT_DEFINITION_EDITOR_FORM))
  },
  saveEditingReportType: reportType => dispatch(ReportActions.saveEditingReportType(reportType)),
  saveEditingReportSubDefinition: (subDefinition, subDefinitionIndex) => {
    dispatch(ReportActions.saveEditingReportSubDefinition(subDefinition, subDefinitionIndex))
    dispatch(reset(Constants.REPORT_DEFINITION_EDITOR_FORM))
  },
  addEditingReportSubDefinition: () => dispatch(ReportActions.addEditingReportSubDefinition()),
  removeEditingReportSubDefinition: subDefinitionIndex => dispatch(ReportActions.removeEditingReportSubDefinition(subDefinitionIndex)),
  saveCurrentReportToServer: () => dispatch(ReportActions.saveCurrentReportToServer()),
  validateReport: planId => dispatch(ReportActions.validateReport(planId))
})

const ReportModuleEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ReportModuleEditor)
export default ReportModuleEditorComponent
