import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { formValueSelector } from 'redux-form'
import ConfigurationActions from './configuration-actions'
import ReportDefinitionEditor from './report-definition-editor.jsx'
import Constants from '../../common/constants'
const selector = formValueSelector(Constants.REPORT_DEFINITION_EDITOR_FORM)

export class ReportModuleEditor extends Component {
  constructor (props) {
    super(props)
    this.props.populateEditingReportDefinition(this.props.reportId)
    this.state = {
      isEditingPrimary: true,
      subDefinitionEditingIndex: -1
    }
  }

  getDefinitionBeingEdited () {
    if (!this.props.moduleDefinition) {
      return null
    } else {
      return this.state.isEditingPrimary
        ? this.props.moduleDefinition.definition
        : this.props.moduleDefinition.subDefinitions[this.state.subDefinitionEditingIndex]
    }
  }

  getEditingKey () {
    return this.state.isEditingPrimary ? 'PRIMARY' : this.state.subDefinitionEditingIndex
  }

  render () {
    return <div className='container' style={{ height: '100%' }}>
      <div className='row' style={{ height: '100%' }}>
        <div className='col-md-2'>
          <ul className='nav nav-pills'>
            <li className='nav-item' key='-1'>
              <a className={`nav-link ${this.state.isEditingPrimary ? 'active' : ''}`}
                onClick={() => this.startEditingPrimaryDefinition()}>
                  Primary Definition
              </a>
            </li>
            {
              this.props.moduleDefinition
                ? this.props.moduleDefinition.subDefinitions.map((subDefinition, index) => (
                  <li className='nav-item' key={subDefinition.id}>
                    <a className={`nav-link ${this.state.subDefinitionEditingIndex === index ? 'active' : ''}`}
                      onClick={() => this.startEditingSubDefinition(index)}>
                      Subdefinition {index}
                    </a>
                  </li>
                ))
                : null
            }
          </ul>
        </div>
        <div className='col-md-10 d-flex flex-column' style={{ height: '100%' }}>
          { this.getDefinitionBeingEdited()
            ? <div className='flex-grow-1'>
              <ReportDefinitionEditor initialValues={this.getDefinitionBeingEdited()} enableReinitialize />
            </div>
            : null
          }
          {/* Show an alert if required */}
          {
            <div className='form-row flex-grow-0'>
              <div className='alert alert-primary' role='alert'>
                This is a primary alert—check it out!
              </div>
            </div>
          }
          <div className='form-row flex-grow-0'>
            <div className='float-right'>
              <button className='btn btn-light'>Test</button>
              <button className='btn btn-primary'>Save Definition</button>
            </div>
          </div>
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
  reportId: PropTypes.number,
  reportDefinition: PropTypes.object
}

const mapStateToProps = (state) => ({
  reportId: state.configuration.reports.reportBeingEdited && state.configuration.reports.reportBeingEdited.id,
  moduleDefinition: (state.configuration.reports.reportBeingEdited &&
    state.configuration.reports.reportBeingEdited.definition &&
    state.configuration.reports.reportBeingEdited.definition.moduleDefinition),
  reportDefinitionEditorValues: selector(state, 'name', 'displayName', 'queryType', 'query')
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  populateEditingReportDefinition: reportId => dispatch(ConfigurationActions.populateEditingReportDefinition(reportId)),
  clearEditingReportDefinition: () => dispatch(ConfigurationActions.clearEditingReportDefinition()),
  saveEditingReportPrimaryDefinition: reportDefinition => dispatch(ConfigurationActions.saveEditingReportPrimaryDefinition(reportDefinition)),
  saveEditingReportSubDefinition: (subDefinition, subDefinitionIndex) => dispatch(ConfigurationActions.saveEditingReportSubDefinition(subDefinition, subDefinitionIndex))
})

const ReportModuleEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ReportModuleEditor)
export default ReportModuleEditorComponent
