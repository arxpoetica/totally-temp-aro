import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class Fusion extends Component {
  render () {
    return <div>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <table className='table table-sm table-striped'>
          <tbody>
            <tr>
              <td>Interval Buffer Distance (m)</td>
              <td>
                <Field name='intervalBufferDistance'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Wormhole Intervals (m)</td>
              <td>
                <Field name='wormHoleIntervals'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Aggregate networks</td>
              <td>
                <Field name='maxLocationDistanceToEdge'
                  className='checkboxfill' component='input' type='checkbox' />
              </td>
            </tr>
            <tr>
              <td>Snapping Distance (m)</td>
              <td>
                <Field name='snappingDistance'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Max connection distance (m)</td>
              <td>
                <Field name='maxConnectionDistance'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Max Wormhole distance (m)</td>
              <td>
                <Field name='maxWormholeDistance'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Wormhole Cost Code</td>
              <td>
                <Field name='wormholeCostCode'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  }
}

let FusionForm = reduxForm({
  form: Constants.FUSION_FORM
})(Fusion)

export default FusionForm
