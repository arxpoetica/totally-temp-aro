import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import ConfigurationActions from './configuration-actions'
import ReportDefinitionEditor from './report-definition-editor.jsx'

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

  render () {
    return <div className='container' style={{ height: '100%' }}>
      <div className='row' style={{ height: '100%' }}>
        <div className='col-md-2'>
          <ul className='nav nav-pills'>
            <li className='nav-item' key='-1'>
              <a className='nav-link active' onClick={() => this.setState({ isEditingPrimary: true, subDefinitionEditingIndex: -1 })}>Primary Definition</a>
            </li>
            {
              this.props.moduleDefinition
                ? this.props.moduleDefinition.subDefinitions.map((subDefinition, index) => (
                  <li className='nav-item' key={subDefinition.id}>
                    <a className='nav-link' onClick={() => this.setState({ isEditingPrimary: false, subDefinitionEditingIndex: index })}>
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
            ? <div className='flex-grow-1'><ReportDefinitionEditor initialValues={this.getDefinitionBeingEdited()} enableReinitialize /></div>
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

  submit (values) {
    // print the form values to the console
    console.log(values)
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
    state.configuration.reports.reportBeingEdited.definition.moduleDefinition)
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  populateEditingReportDefinition: reportId => dispatch(ConfigurationActions.populateEditingReportDefinition(reportId))
})

const ReportModuleEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ReportModuleEditor)
export default ReportModuleEditorComponent
