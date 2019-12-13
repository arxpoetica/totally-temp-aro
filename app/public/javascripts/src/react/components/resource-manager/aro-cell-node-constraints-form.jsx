import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class AroCellNodeConstraints extends Component {
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
        <td className='pl-4'>Minimum Ray Length (m)</td>
        <td>
          <Field name='minimumRayLength'
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
    </Fragment>
  }
}

let AroCellNodeConstraintsForm = reduxForm({
  form: Constants.ARO_CELL_NODE_CONSTRAINTS_FORM
})(AroCellNodeConstraints)

export default AroCellNodeConstraintsForm
