import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class RingOptionsBasic extends Component {
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
                    <Field
                      id={`field_${optionKey}`}
                      name={`${optionKey}.value`}
                      className='form-control form-control-sm'
                      component='input'
                      type='text' />
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </form>
    </div>
  }
}

let RingOptionsBasicForm = reduxForm({
  form: Constants.RING_OPTIONS_BASIC_FORM
})(RingOptionsBasic)

export default RingOptionsBasicForm
