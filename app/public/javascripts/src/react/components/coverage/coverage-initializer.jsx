import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CoverageActions from './coverage-actions'
import SelectionActions from '../selection/selection-actions'
import PlanTargetListComponent from '../selection/plan-target-list.jsx'

export class CoverageInitializer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      coverageTypes: [
        { id: 'census_block', name: 'Form 477' },
        { id: 'location', name: 'Locations' }
      ],
      groupKeyTypes: [
        { id: 'serviceArea', name: 'Service Areas' },
        { id: 'networkNode', name: 'Network Nodes' },
        { id: 'location', name: 'Locations' }
      ],
      siteAssignments: ['Proximity', 'Incremental'],
      selectedSiteAssignment: 'Incremental'
    }
  }
  displayGeographies (displayOnly) {
    if (this.props.activeSelectionModeId !== 'ALL_SERVICE_AREAS' && this.props.activeSelectionModeId !== 'ALL_PLAN_AREAS') {
      return (<tr><td width='50%'>Selected<br /> Geographies</td><td><PlanTargetListComponent displayOnly={displayOnly} /></td></tr>)
    }
  }
  render () {
    // If we have a valid report, then disable all controls
    var displayOnly = false
    if (this.props.coverageReport) displayOnly = true

    return <div>
      <table id='table-coverage-initializer' className='table table-sm table-striped sidebar-options-table'>
        <tbody>

          {/* Coverage type */}
          <tr>
            <td>Coverage Type</td>
            <td>
              <select id='selectCoverageType'
                className='form-control'
                disabled={displayOnly}
                value={this.props.coverageType}
                onChange={(event) => this.props.setCoverageType(event.target.value)}>
                {this.state.coverageTypes.map(item => <option value={item.id} key={`selectCoverageType_${item.id}`}>{item.name}</option>)}
              </select>
            </td>
          </tr>

          {/* Group key types */}
          <tr>
            <td>Save coverage in</td>
            <td>
              <select id='selectGroupKeyType'
                className='form-control'
                disabled={displayOnly}
                value={this.props.groupKeyType}
                onChange={(event) => this.props.setGroupKeyType(event.target.value)}>
                {this.state.groupKeyTypes.map(item => <option value={item.id} key={`selectGroupKeyType_${item.id}`}>{item.name}</option>)}
              </select>
            </td>
          </tr>

          {/* Limit To Marketable Technology */}
          <tr>
            <td>Limit To Marketable Technology</td>
            <td>
              <input id='chkLimitMarketableTechnologies'
                type='checkbox'
                className='checkboxfill'
                disabled={displayOnly}
                checked={this.props.useMarketableTechnologies}
                onChange={event => this.props.setLimitMarketableTechnology(event.target.checked)} />
            </td>
          </tr>

          {/* Limit To Max Equipment Speed */}
          <tr>
            <td>Limit To Max Equipment Speed</td>
            <td>
              <input id='chkLimitMaxSpeed'
                type='checkbox'
                className='checkboxfill'
                disabled={displayOnly}
                checked={this.props.useMaxSpeed}
                onChange={event => this.props.setLimitMaxSpeed(event.target.checked)} />
            </td>
          </tr>

          {/* Use Existing Fiber */}
          <tr>
            <td>Use Existing Fiber</td>
            <td>
              <input id='chkUseExistingFiber'
                type='checkbox'
                className='checkboxfill'
                disabled={displayOnly}
                checked={this.props.useExistingFiber}
                onChange={event => this.props.setExistingFiber(event.target.checked)} />
            </td>
          </tr>

          {/* Use Planned Fiber */}
          <tr>
            <td>Use Planned Fiber</td>
            <td>
              <input id='chkUsePlannedFiber'
                type='checkbox'
                className='checkboxfill'
                disabled={displayOnly}
                checked={this.props.usePlannedFiber}
                onChange={event => this.props.setPlannedFiber(event.target.checked)} />
            </td>
          </tr>

          {/* Site assignment */}
          <tr>
            <td>Site Assignment</td>
            <td>
              <select className='form-control'
                disabled={displayOnly}
                value={this.state.selectedSiteAssignment}
                onChange={event => this.setState({ selectedSiteAssignment: event.target.value })}>
                {this.state.siteAssignments.map(item => <option value={item} key={`selectSiteAssignment_${item}`}>{item}</option>)}
              </select>
            </td>
          </tr>

          {/* The selection type (service areas/analysis areas) */}
          <tr>
            <td>Selection Type</td>
            <td>
              <select id='selectCoverageInitializerSelectionType'
                className='form-control'
                disabled={displayOnly}
                value={this.props.activeSelectionModeId}
                onChange={event => this.props.setSelectionTypeById(event.target.value)}>
                {this.props.selectionModes.map(item => <option value={item.id} key={`selectCoverageInitializerSelectionType_${item.id}`}>{item.description}</option>)}
              </select>
            </td>
          </tr>
          {
            this.displayGeographies(displayOnly)
          }
        </tbody>
      </table>
    </div>
  }
}

CoverageInitializer.propTypes = {
  activeSelectionModeId: PropTypes.string,
  selectionModes: PropTypes.array,
  coverageType: PropTypes.string,
  groupKeyType: PropTypes.string,
  useMarketableTechnologies: PropTypes.bool,
  useMaxSpeed: PropTypes.bool,
  useExistingFiber: PropTypes.bool,
  usePlannedFiber: PropTypes.bool,
  coverageReport: PropTypes.object
}

const getAllSelectionModes = state => state.selection.selectionModes
const getAllowedSelectionModes = createSelector([getAllSelectionModes],
  (selectionModes) => selectionModes.filter(item => item.id !== 'SELECTED_LOCATIONS'))

const mapStateToProps = state => ({
  activeSelectionModeId: state.selection.activeSelectionMode.id,
  selectionModes: getAllowedSelectionModes(state),
  coverageType: state.coverage.initializationParams.coverageType,
  groupKeyType: state.coverage.initializationParams.groupKeyType,
  useMarketableTechnologies: state.coverage.initializationParams.useMarketableTechnologies,
  useMaxSpeed: state.coverage.initializationParams.useMaxSpeed,
  useExistingFiber: state.coverage.initializationParams.useExistingFiber,
  usePlannedFiber: state.coverage.initializationParams.usePlannedFiber,
  coverageReport: state.coverage.report
})

const mapDispatchToProps = (dispatch) => ({
  setCoverageType: coverageType => dispatch(CoverageActions.setCoverageType(coverageType)),
  setGroupKeyType: groupKeyType => dispatch(CoverageActions.setGroupKeyType(groupKeyType)),
  setLimitMarketableTechnology: limitMarketableTechnology => dispatch(CoverageActions.setLimitMarketableTechnology(limitMarketableTechnology)),
  setLimitMaxSpeed: limitMaxSpeed => dispatch(CoverageActions.setLimitMaxSpeed(limitMaxSpeed)),
  setExistingFiber: existingFiber => dispatch(CoverageActions.setExistingFiber(existingFiber)),
  setPlannedFiber: plannedFiber => dispatch(CoverageActions.setPlannedFiber(plannedFiber)),
  setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
})

const CoverageInitializerComponent = wrapComponentWithProvider(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
