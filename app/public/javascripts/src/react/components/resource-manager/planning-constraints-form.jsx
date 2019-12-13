import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class PlanningConstraints extends Component {
  render () {
    return <div>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <table className='table table-sm table-striped'>
          <tbody>
            <tr>
              <td>Fiber routing mode</td>
              <td>
                <Field id='routingMode' name='fiberRoutingMode'
                  className='form-control form-control-sm' component='select' type='text'>
                  <option value='ROUTE_FROM_NODES'>Route from nodes</option>
                  <option value='ROUTE_FROM_FIBER'>Route from fiber</option>
                </Field>
              </td>
            </tr>
            <tr>
              <td>Infer CO when missing</td>
              <td>
                <Field id='routingMode' name='inferCoWhenMissing'
                  className='checkboxfill' component='input' type='checkbox' />
              </td>
            </tr>
            <tr>
              <td>Fiber buffer size (m)</td>
              <td>
                <Field id='routingMode' name='fiberBufferSize'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Max distance - location to edge (m)</td>
              <td>
                <Field id='routingMode' name='maxLocationDistanceToEdge'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Max distance - eqipment to edge (m)</td>
              <td>
                <Field id='routingMode' name='maxEquipmentDistanceToEdge'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
            <tr>
              <td>Edge buffer distance (m)</td>
              <td>
                <Field id='routingMode' name='edgeBufferDistance'
                  className='form-control form-control-sm' component='input' type='text' />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  }
}

let PlanningConstraintsForm = reduxForm({
  form: Constants.PLANNING_CONSTRAINTS_FORM
})(PlanningConstraints)

export default PlanningConstraintsForm
