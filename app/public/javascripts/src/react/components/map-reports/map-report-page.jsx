import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

const PAGE_SIZES = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']
const SCALING_FACTORS = [
  { worldLengthPerMeterOfPaper: '1000', displayName: '1 : 1,000'},
  { worldLengthPerMeterOfPaper: '10000', displayName: '1 : 10,000'},
  { worldLengthPerMeterOfPaper: '100000', displayName: '1 : 100,000'},
  { worldLengthPerMeterOfPaper: '1000000', displayName: '1 : 1,000,000'}
]
const ORIENTATIONS = [
  { id: 'portrait', displayName: 'Portrait' },
  { id: 'landscape', displayName: 'Landscape' }
]

export class MapReportPage extends Component {
  render () {
    return <div>
      <h4>Page definition</h4>
      <table className='table table-sm table-striped'>
        <tbody>
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
            <td><Field id='fieldPageSize' name='worldLengthPerMeterOfPaper' className='form-control form-control-sm'
              component='select' type='text'>
                { SCALING_FACTORS.map(scalingFactor => <option key={scalingFactor.worldLengthPerMeterOfPaper} value={scalingFactor.worldLengthPerMeterOfPaper}>{scalingFactor.displayName}</option>) }
              </Field>
            </td>
          </tr>
          {/* The print DPI */}
          <tr>
            <td>Resolution (dpi)</td>
            <td><Field id='fieldPageSize' name='dpi' className='form-control form-control-sm'
              component='input' type='number' normalize={val => Math.max(1, Math.min(300, val))} />
            </td>
          </tr>
          {/* The orientation */}
          <tr>
            <td>Orientation</td>
            <td><Field id='fieldPageSize' name='orientation' className='form-control form-control-sm'
              component='select' type='text'>
                { ORIENTATIONS.map(orientation => <option key={orientation.id} value={orientation.id}>{orientation.displayName}</option>) }
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
