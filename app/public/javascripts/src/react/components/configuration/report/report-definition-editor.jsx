import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../../common/constants'
import './report-definition-editor.css'

const renderField = ({
  input,
  label,
  type,
  meta: { touched, error, warning }
}) => (
  <div>
    <input {...input} placeholder={label} type={type} className='form-control' />
    {error && <div className='text-danger' style={{ fontSize: '10px', fontWeight: 'bold' }}>{error}</div>}
  </div>
)

export class ReportDefinitionEditor extends Component {
  render () {
    return <form className='d-flex flex-column report-definition-editor'
      style={{ height: '100%' }}
      onSubmit={event => event.preventDefault()}>
      <div className='form-row flex-grow-0'>
        <div className='col'>
          <label>Name</label>
          <Field name='name' className='form-control' type='text' validate={[this.validateName]} component={renderField} />
        </div>
        <div className='col'>
          <label>Display Name</label>
          <Field name='displayName' className='form-control' component='input' type='text' />
        </div>
        <div className='col'>
          <label>Query Type</label>
          <Field name='queryType' className='form-control' component='select' type='text'>
            <option value='SQL_REPORT'>SQL Report</option>
            <option value='SQL_SCRIPT'>SQL Script</option>
            <option value='KML_REPORT'>KML Report</option>
          </Field>
        </div>
      </div>
      <div className='form-row flex-grow-1' style={{ paddingTop: '10px', paddingBottom: '10px' }}>
        <div className='col' style={{ height: '100%' }}>
          <Field name='query' className='form-control' component='textarea' type='text' style={{ height: '100%', fontFamily: 'Courier New', fontSize: '12px', minHeight: '20em' }} />
        </div>
      </div>
    </form>
  }

  validateName (value) {
    value = value || ''
    return (value.indexOf(' ') >= 0) ? 'Name cannot have spaces' : undefined
  }
}

let ReportDefinitionEditorForm = reduxForm({
  form: Constants.REPORT_DEFINITION_EDITOR_FORM
})(ReportDefinitionEditor)

export default ReportDefinitionEditorForm
