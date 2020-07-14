import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

export class PlanningConstraints extends Component {
  render () {
    return (
      <div>
        <form className='d-flex flex-column rfp-options'
          style={{ height: '100%' }}
          onSubmit={event => event.preventDefault()}>
          <table className='table table-sm table-striped'>
            <tbody>

              <tr>
                <td colSpan={2}>Cell Node Constraints</td>
              </tr>
              <tr>
                <td className='pl-4'>Placement Strategy</td>
                <td>
                  <Field name='cellNodeConstraints.placementStrategy'
                    className='form-control form-control-sm' component='select' type='text'>
                    <option value='RANDOM'>Random</option>
                    <option value='EXISTING_LOCATIONS'>Existing Locations</option>
                    <option value='EXISTING_AND_RANDOM'>Existing and Random</option>
                  </Field>
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Polygon Strategy</td>
                <td>
                  <Field name='cellNodeConstraints.polygonStrategy'
                    className='form-control form-control-sm' component='select' type='text'>
                    <option value='FIXED_RADIUS'>Fixed Radius</option>
                    <option value='AVERAGE_RADIUS'>Average Radius</option>
                    <option value='RAY_TRACING'>Ray Tracing</option>
                  </Field>
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Cell Radius (m)</td>
                <td>
                  <Field name='cellNodeConstraints.cellRadius'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Cell Granularity Ratio</td>
                <td>
                  <Field name='cellNodeConstraints.cellGranularityRatio'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Minimum Ray Length (m)</td>
                <td>
                  <Field name='cellNodeConstraints.minimumRayLength'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Snapping Distance (m)</td>
                <td>
                  <Field name='cellNodeConstraints.snappingDistanceMeters'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>

              <tr>
                <td colSpan={2}>DSLAM Node Constraints</td>
              </tr>
              <tr>
                <td className='pl-4'>Placement Strategy</td>
                <td>
                  <Field name='dslamNodeConstraints.placementStrategy'
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
                  <Field name='dslamNodeConstraints.cellRadius'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Cell Granularity Ratio</td>
                <td>
                  <Field name='dslamNodeConstraints.cellGranularityRatio'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Snapping Distance (m)</td>
                <td>
                  <Field name='dslamNodeConstraints.snappingDistanceMeters'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>Optimization Speed (Mbs)</td>
                <td>
                  <Field name='dslamNodeConstraints.optimizationSpeedMbs'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>

              <tr>
                <td colSpan={2}>RFP Options</td>
              </tr>
              <tr>
                <td className='pl-4'>RFP Max Points</td>
                <td>
                  <Field name='rfpMaxPoints'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>RFP Max Source Distance (m)</td>
                <td>
                  <Field name='rfpMaxSourceDistance'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td className='pl-4'>RFP Max Buffer Distance</td>
                <td>
                  <Field name='rfpMaxBufferDistance'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              
              <tr>
                <td>Fiber routing mode</td>
                <td>
                  <Field name='fiberRoutingMode'
                    className='form-control form-control-sm' component='select' type='text'>
                    <option value='ROUTE_FROM_NODES'>Route from nodes</option>
                    <option value='ROUTE_FROM_FIBER'>Route from fiber</option>
                  </Field>
                </td>
              </tr>
              { /*
              <tr>
                <td>Minimum fiber splice capacity</td>
                <td>
                  <Field name='minFiberSpliceCapacity'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              */ }
              <tr>
                { /*
                <td>Infer CO when missing</td>
                <td>
                  <Field name='inferCoWhenMissing'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
                */ }
                <td>Missing CO strategy</td>
                <td>
                  <div>
                    <Field name='missingCoStrategy'
                      className='checkboxfill' component='input' type='radio' value='doNothing' /> Do nothing
                  </div>
                  <div>
                    <Field name='missingCoStrategy'
                      className='checkboxfill' component='input' type='radio' value='useExistingSplicePoints' /> Use Existing Splice Points Only
                  </div>
                  <div>
                    <Field name='missingCoStrategy'
                      className='checkboxfill' component='input' type='radio' value='useSyntheticSplicePoints' /> Use Synthetic Splice Points Only
                  </div>
                  <div>
                    <Field name='missingCoStrategy'
                      className='checkboxfill' component='input' type='radio' value='useAllSplicePoints' /> Use All Splice Points
                  </div>
                  <div>
                    <Field name='missingCoStrategy'
                      className='checkboxfill' component='input' type='radio' value='usePrimaryEdges' /> Use Primary Edges
                  </div>
                </td>
              </tr>
              <tr>
                <td>Fiber buffer size (m)</td>
                <td>
                  <Field name='fiberBufferSize'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td>Max distance - location to edge (m)</td>
                <td>
                  <Field name='maxLocationDistanceToEdge'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td>Max distance - eqipment to edge (m)</td>
                <td>
                  <Field name='maxEquipmentDistanceToEdge'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td>Edge buffer distance (m)</td>
                <td>
                  <Field name='edgeBufferDistance'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td>Business cluster distance (m)</td>
                <td>
                  <Field name='businessClusterDistance'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td>Household cluster distance (m)</td>
                <td>
                  <Field name='householdClusterDistance'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
                <td>Summarize Service Mods</td>
                <td>
                  <Field name='summarizeServiceMods'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
              <tr>
                <td>Generate Plan Location Links</td>
                <td>
                  <Field name='generatePlanLocationLinks'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
              <tr>
                <td>Generate Subnet Linking</td>
                <td>
                  <Field name='generateSubnetLinking'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
              <tr>
                <td>Persist Junction Nodes</td>
                <td>
                  <Field name='persistJunctionNodes'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
              <tr>
                <td>Aggregated BOM</td>
                <td>
                  <Field name='aggregatedBOM'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
              <tr>
                <td>Log Request Event</td>
                <td>
                  <Field name='logRequestEvent'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    )
  }
}

let PlanningConstraintsForm = reduxForm({
  form: Constants.PLANNING_CONSTRAINTS_FORM
})(PlanningConstraints)

export default PlanningConstraintsForm
