import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class ReportDefinitionEditor extends Component {
  render () {
    return <form className='d-flex flex-column' style={{ height: '100%' }} onSubmit={event => event.preventDefault()}>
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
          <Field name='query' className='form-control' component='textarea' type='text' style={{ height: '100%', fontFamily: 'Courier New', fontSize: '12px' }} />
        </div>
      </div>
    </form>
  }
}

let ReportDefinitionEditorForm = reduxForm({
  form: Constants.REPORT_DEFINITION_EDITOR_FORM
})(ReportDefinitionEditor)

export default ReportDefinitionEditorForm
