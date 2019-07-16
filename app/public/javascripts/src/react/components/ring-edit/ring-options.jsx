import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class RingOptions extends Component {
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
                // var option = this.props.initialValues[optionKey]
                // if (typeof option === 'object' && option.hasOwnProperty('displayName'))
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
      <br />
      <h4>Edge Types</h4>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <table className='table table-sm table-striped'>
          <tbody>
            <tr key='targetEdgeTypes.road'>
              <td>Road</td>
              <td>
                <Field
                  id='field_targetEdgeTypes.road'
                  name='targetEdgeTypes.road.value'
                  className='form-control form-control-sm'
                  component='input'
                  type='checkbox' />
              </td>
            </tr>
            <tr key='targetEdgeTypes.sewer'>
              <td>Sewer</td>
              <td>
                <Field
                  id='field_targetEdgeTypes.sewer'
                  name='targetEdgeTypes.sewer.value'
                  className='form-control form-control-sm'
                  component='input'
                  type='checkbox' />
              </td>
            </tr>
            <tr key='targetEdgeTypes.duct'>
              <td>Duct</td>
              <td>
                <Field
                  id='field_targetEdgeTypes.duct'
                  name='targetEdgeTypes.duct.value'
                  className='form-control form-control-sm'
                  component='input'
                  type='checkbox' />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
      
    </div>
  }

  renderList () {

  }

  renderItem (item, key) {
    if (typeof item !== 'object' || !item.hasOwnProperty('displayName') || !item.hasOwnProperty('value')) return ''
    var inputType = ''
    switch (typeof item.value) {
      case 'string':
        inputType = 'text'
        break;
      
      case 'number':
        inputType = 'number'
        break;

      case 'string':
        inputType = 'checkbox'
        break;

      default:
        return ''
    }

    return <tr key={key}>
            <td>{item.displayName}</td>
            <td>
              <Field
                id={`field_${key}`}
                name={`${key}.value`}
                className='form-control form-control-sm'
                component={`${inputType}`}
                type='text' />
            </td>
          </tr>
  }
}

let RingOptionsForm = reduxForm({
  form: Constants.RING_OPTIONS_FORM
})(RingOptions)

export default RingOptionsForm
