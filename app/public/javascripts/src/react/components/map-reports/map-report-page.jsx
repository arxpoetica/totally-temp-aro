import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'
import ScalingFactors from './scaling-factors'
import Orientation from './orientations'

const PAGE_SIZES = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']

export class MapReportPage extends Component {
  render () {
    return <div>
      <h4>Page definition</h4>
      <table className='table table-sm table-striped'>
        <tbody>
          {/* The page title */}
          <tr>
            <td>Title</td>
            <td><Field id='fieldPageTitle' name='title' className='form-control form-control-sm'
              component='input' type='text' />
            </td>
          </tr>
          {/* The paper size */}
          <tr>
            <td>Paper Size</td>
            <td><Field id='fieldPageSize' name='paperSize' className='form-control form-control-sm'
              component='select' type='text'>
                { PAGE_SIZES.map(paperSize => <option key={paperSize} value={paperSize}>{paperSize}</option>) }
              </Field>
            </td>
          </tr>
          {/* The scaling factor */}
          <tr>
            <td>Scaling factor</td>
            <td><Field id='fieldPageScalingFactor' name='worldLengthPerMeterOfPaper' className='form-control form-control-sm'
              component='select' type='text'>
                { Object.keys(ScalingFactors)
                  .filter(scalingFactorId => scalingFactorId !== 'default')
                  .map(scalingFactorId => <option key={scalingFactorId} value={scalingFactorId}>{ScalingFactors[scalingFactorId]}</option>) }
              </Field>
            </td>
          </tr>
          {/* The print DPI */}
          <tr>
            <td>Resolution (dpi)</td>
            <td><Field id='fieldPageResolution' name='dpi' className='form-control form-control-sm'
              component='input' type='number' normalize={val => Math.max(1, Math.min(300, val))} />
            </td>
          </tr>
          {/* The orientation */}
          <tr>
            <td>Orientation</td>
            <td><Field id='fieldPageOrientation' name='orientation' className='form-control form-control-sm'
              component='select' type='text'>
                { Object.keys(Orientation).map(orientationId => <option key={orientationId} value={orientationId}>{Orientation[orientationId]}</option>) }
              </Field>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  }
}

MapReportPage.propTypes = {
}

let MapReportPageForm = reduxForm({
  form: Constants.MAP_REPORTS_PAGE_FORM
})(MapReportPage)

export default MapReportPageForm
