import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'

export class RfpOptions extends Component {
  render () {
    return <div className='p-2 m-2'>
      <h4>Options</h4>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <table className='table table-sm table-striped'>
          <tbody>
            {
              Object.keys(this.props.initialValues).map(optionKey => (
                <tr key={optionKey}>
                  <td>{this.props.initialValues[optionKey].displayName}</td>
                  <td>
                    <Field name={`${optionKey}.value`} className='form-control form-control-sm' component='select' type='text'>
                      <option value='ROUTE_FROM_NODES'>Route from nodes</option>
                      <option value='ROUTE_FROM_FIBER'>Route from fiber</option>
                    </Field>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </form>
    </div>
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
