import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'

export class RfpOptions extends Component {
  render () {
    return <form className='d-flex flex-column rfp-options'
      style={{ height: '100%' }}
      onSubmit={event => event.preventDefault()}>
      <table className='table table-sm table-striped'>
        <tbody>
          {
            Object.keys(this.props.initialValues).map(optionKey => (
              <tr key={optionKey}>
                <td>{this.props.initialValues[optionKey].displayName}</td>
                <td>
                  <Field name={`${optionKey}.value`} className='form-control' component='input' type='text' />
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
      {/* <div className='form-row flex-grow-0'>
        <div className='col'>
          <label>Name</label>
          <Field name='name' className='form-control' type='text' validate={[this.validateName]} />
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
          <Field name='query' className='form-control' component='textarea' type='text' style={{ height: '100%', fontFamily: 'Courier New', fontSize: '12px' }} />
        </div>
      </div> */}
    </form>
  }

  validateName (value) {
    value = value || ''
    return (value.indexOf(' ') >= 0) ? 'Name cannot have spaces' : undefined
  }
}

let RfpOptionsForm = reduxForm({
  form: 'rfp'
})(RfpOptions)

export default RfpOptionsForm
