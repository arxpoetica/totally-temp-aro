import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import { MultiSelect } from '@mantine/core';
import Constants from '../../common/constants'

export class PlanningConstraints extends Component {
  render() {
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
                <td>Fiber routing mode</td>
                <td>
                  <Field name='fiberRoutingMode'
                    className='form-control form-control-sm' component='select' type='text'>
                    <option value='ROUTE_FROM_NODES'>Route from nodes</option>
                    <option value='ROUTE_FROM_FIBER'>Route from fiber</option>
                  </Field>
                </td>
              </tr>
              <tr>
                <td>Minimum fiber splice capacity</td>
                <td>
                  <Field name='minFiberSpliceCapacity'
                    className='form-control form-control-sm' component='input' type='text' />
                </td>
              </tr>
              <tr>
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
                <td>Max distance - equipment to edge (m)</td>
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

              {/* TODO: This is hardcoded for now and needs to get it from backend using.
                /type-enum/hub_placement_strategy end point
                In order to do that this whole form has to be refactored */}
              <tr>
                <td>Hub Clustering Strategy</td>
                <td>
                  <Field name='hubClusterStrategyType'
                    className='form-control form-control-sm' component='select' type='text'>
                    <option value='DAG'>Directed Acyclic Graph</option>
                    <option value='KMEANS_PP'>K-Means Clustering</option>
                    <option value='MST_DAG'>Minimum Spanning Tree</option>
                  </Field>
                </td>
              </tr>
              <tr>
                <td>Hub Location Strategy</td>
                <td>
                  <Field name='hubLocationStrategyType'
                    className='form-control form-control-sm' component='select' type='text'>
                    <option value='OPTIMIZED'>Optimized</option>
                    <option value='CENTERED'>Centered</option>
                  </Field>
                </td>
              </tr>
              <tr>
                <td>Polygonizer Road Edge Types</td>
                <td>
                  <Field name='polygonizerRoadEdgeTypes'
                    component={genericMultiSelect} 
                    props={{data: ['primary', 'secondary', 'tertiary']}}
                    type='select-multiple' /> 
                </td>
              </tr>
              <tr>
                <td>Polygonizer Hub Cutting Threshold</td>
                <td>
                  <Field name='polygonizerhubCuttingThreshold'
                    className='form-control form-control-sm'
                    component='input' 
                    type='text' />
                </td>
              </tr>
              <tr>
                <td>Run Near Net</td>
                <td>
                  <Field name='generateNearNetAnalysis'
                    className='checkboxfill' component='input' type='checkbox' />
                </td>
              </tr>
              <tr>
                <td>Feeder Fiber Cable Codes</td>
                <td>
                  <Field name='cableCodeConfig.cableCodeMap.FEEDER'
                    component={genericMultiSelect}
                    props={{data: this.props.cableSizeList}}
                    type='select-multiple' />
                </td>
              </tr>
              <tr>
                <td>Distribution Fiber Cable Codes</td>
                <td>
                  <Field name='cableCodeConfig.cableCodeMap.DISTRIBUTION'
                    component={genericMultiSelect}
                    props={{data: this.props.cableSizeList}}
                    type='select-multiple' />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
        <style jsx>{`
          td {
            width: 50%;
          }
        `}</style>
      </div>
    )
  }
}
// this is a workaround to fit a new mantine form into the current system
// To use pass props with a data value that works with mantine multi select
const genericMultiSelect = (props) => {
  // I am just passing value and onChange down to the input from Field
  // onBlur was clearing out the form in redux-form
  return (
    <MultiSelect 
      data={props.data}
      value={props.input.value} 
      onChange={props.input.onChange}
    />
  )
}

const PlanningConstraintsForm = reduxForm({
  form: Constants.PLANNING_CONSTRAINTS_FORM
})(PlanningConstraints)

export default PlanningConstraintsForm
