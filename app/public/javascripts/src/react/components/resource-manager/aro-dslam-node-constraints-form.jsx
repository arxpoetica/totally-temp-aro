import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class AroDslamNodeConstraints extends Component {
  render () {
    return <Fragment>
      <tr>
        <td className='pl-4'>Placement Strategy</td>
        <td>
          <Field name='placementStrategy'
            className='form-control form-control-sm' component='select' type='text'>
            <option value='RANDOM'>Random</option>
            <option value='EXISTING_LOCATIONS'>Existing Locations</option>
            <option value='EXISTING_AND_RANDOM'>Existing and Random</option>
          </Field>
        </td>
      </tr>
      <tr>
        <td className='pl-4'>Cell Radius (m)</td>
        <td>
          <Field name='cellRadius'
            className='form-control form-control-sm' component='input' type='text' />
        </td>
      </tr>
      <tr>
        <td className='pl-4'>Cell Granularity Ratio</td>
        <td>
          <Field name='cellGranularityRatio'
            className='form-control form-control-sm' component='input' type='text' />
        </td>
      </tr>
      <tr>
        <td className='pl-4'>Snapping Distance (m)</td>
        <td>
          <Field name='snappingDistanceMeters'
            className='form-control form-control-sm' component='input' type='text' />
        </td>
      </tr>
      <tr>
        <td className='pl-4'>Optimization Speed (Mbs)</td>
        <td>
          <Field name='optimizationSpeedMbs'
            className='form-control form-control-sm' component='input' type='text' />
        </td>
      </tr>
    </Fragment>
  }
}

let AroDslamNodeConstraintsForm = reduxForm({
  form: Constants.ARO_DSLAM_NODE_CONSTRAINTS_FORM
})(AroDslamNodeConstraints)

export default AroDslamNodeConstraintsForm
