import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { PropTypes } from 'prop-types'
import ConfigurationActions from './configuration-actions'

// First define the form
let ReportDefinitionForm = props => {
  const { handleSubmit } = props
  return <div className='container' style={{ height: '100%' }}>
    <div className='row' style={{ height: '100%' }}>
      <div className='col-md-2'>
        <ul className='nav nav-pills'>
          <li className='nav-item'>
            <a className='nav-link active'>Primary Definition</a>
          </li>
        </ul>
      </div>
      <div className='col-md-10' style={{ height: '100%' }}>
        <form className='d-flex flex-column' onSubmit={handleSubmit} style={{ height: '100%' }}>
          <div className='form-row flex-grow-0'>
            <div className='col'>
              <Field name='name' className='form-control' component='input' type='text' />
            </div>
            <div className='col'>
              <Field name='displayName' className='form-control' component='input' type='text' />
            </div>
            <div className='col'>
              <Field name='queryType' className='form-control' component='input' type='text' />
            </div>
          </div>
          <div className='form-row flex-grow-1' style={{ paddingTop: '10px' }}>
            <div className='col' style={{ height: '100%' }}>
              <Field name='query' className='form-control' component='textarea' style={{ fontFamily: 'Courier New', fontSize: '10px', height: '100%' }} />
            </div>
          </div>
          {/* Show an alert if required */}
          {
            <div className=' form-row flex-grow 0'>
              <div className='col'>
                <div className='alert alert-primary' role='alert'>
                  This is a primary alert—check it out!
                </div>
              </div>
            </div>
          }
          <div className='form-row flex-grow-0'>
            <div className='col'>
              <div className='float-right'>
                <button className='btn btn-light' type='submit'>Test</button>
                <button className='btn btn-primary' type='submit'>Save Definition</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
}

ReportDefinitionForm = reduxForm({ form: 'reportDefinitionEditor' })(ReportDefinitionForm)
ReportDefinitionForm = connect(
  state => ({
    initialValues: (state.configuration.reports.reportBeingEdited && state.configuration.reports.reportBeingEdited.definition && state.configuration.reports.reportBeingEdited.definition.moduleDefinition.definition)
  }),
  {}
)(ReportDefinitionForm)

export class ReportDefinitionEditor extends Component {
  constructor (props) {
    super(props)
    this.props.populateEditingReportDefinition(this.props.reportId)
  }

  render () {
    return <ReportDefinitionForm onSubmit={this.submit} />
  }

  submit (values) {
    // print the form values to the console
    console.log(values)
  }
}

ReportDefinitionEditor.propTypes = {
  reportId: PropTypes.number,
  reportDefinition: PropTypes.object
}

const mapStateToProps = (state) => ({
  reportId: state.configuration.reports.reportBeingEdited && state.configuration.reports.reportBeingEdited.id
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  populateEditingReportDefinition: reportId => dispatch(ConfigurationActions.populateEditingReportDefinition(reportId))
})

const ReportDefinitionEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ReportDefinitionEditor)
export default ReportDefinitionEditorComponent
