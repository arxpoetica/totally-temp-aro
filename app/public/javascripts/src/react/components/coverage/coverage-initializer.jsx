import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CoverageActions from './coverage-actions'
import SelectionActions from '../selection/selection-actions'
import PlanTargetList from '../selection/plan-target-list.jsx'

class CoverageInitializer extends Component {
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
      selectedSiteAssignment: 'Proximity'
    }
  }

  render () {
    return <div>
      <table id='table-coverage-initializer' ng-if='$ctrl.isSuperUser' className='table table-sm table-striped sidebar-options-table'>
        <tbody>

          {/* Coverage type */}
          <tr>
            <td>Coverage Type</td>
            <td>
              <select className='form-control'
                value={this.props.coverageType}
                onChange={(event) => this.props.setCoverageType(event.target.value)}>
                {this.state.coverageTypes.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </td>
          </tr>

          {/* Group key types */}
          <tr>
            <td>Save coverage in</td>
            <td>
              <select className='form-control'
                value={this.props.groupKeyType}
                onChange={(event) => this.props.setGroupKeyType(event.target.value)}>
                {this.state.groupKeyTypes.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </td>
          </tr>

          {/* Limit To Marketable Technology */}
          <tr>
            <td>Limit To Marketable Technology</td>
            <td>
              <input type='checkbox'
                className='checkboxfill'
                checked={this.props.useMarketableTechnologies}
                onChange={event => this.props.setLimitMarketableTechnology(event.target.checked)} />
            </td>
          </tr>

          {/* Limit To Max Equipment Speed */}
          <tr>
            <td>Limit To Max Equipment Speed</td>
            <td>
              <input type='checkbox'
                className='checkboxfill'
                checked={this.props.useMaxSpeed}
                onChange={event => this.props.setLimitMaxSpeed(event.target.checked)} />
            </td>
          </tr>

          {/* Site assignment */}
          <tr>
            <td>Site Assignment</td>
            <td>
              <select className='form-control'
                value={this.state.selectedSiteAssignment}
                onChange={event => this.setState({ selectedSiteAssignment: event.target.value })}>
                {this.state.siteAssignments.map(item => <option value={item} key={item}>{item}</option>)}
              </select>
            </td>
          </tr>

          {/* The selection type (service areas/analysis areas) */}
          <tr>
            <td>Selection Type</td>
            <td>
              <select className='form-control'
                value={this.props.activeSelectionModeId}
                onChange={event => this.props.setSelectionTypeById(event.target.value)}>
                {this.props.selectionModes.map(item => <option value={item.id} key={item.id}>{item.description}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <td>Selected Geographies</td>
            <td><PlanTargetList /></td>
          </tr>
        </tbody>
      </table>

      {/* If we have a valid report, then disable all controls */}
      {this.props.isSuperUser && this.props.coverageReport
        ? <div ng-if='$ctrl.isSuperUser && $ctrl.coverageReport'
          className='disable-sibling-controls' />
        : null
      }

      {/* Show an error message if the logged in user is not a SuperUser */}
      {!this.props.isSuperUser
        ? <div className='alert alert-danger' style={{ marginTop: '60px' }}>
            You must be a system-wide superuser in order to use coverage reports.
        </div>
        : null}

    </div>
  }
}

CoverageInitializer.propTypes = {
  isSuperUser: PropTypes.bool,
  activeSelectionModeId: PropTypes.string,
  selectionModes: PropTypes.array,
  coverageType: PropTypes.string,
  groupKey: PropTypes.string,
  useMarketableTechnologies: PropTypes.bool,
  useMaxSpeed: PropTypes.bool,
  coverageReport: PropTypes.object
}

const getAllSelectionModes = state => state.selection.selectionModes
const getAllowedSelectionModes = createSelector([getAllSelectionModes],
  (selectionModes) => selectionModes.filter(item => item.id !== 'SELECTED_LOCATIONS'))

const mapStateToProps = state => ({
  isSuperUser: state.user.isSuperUser,
  activeSelectionModeId: state.selection.activeSelectionMode.id,
  selectionModes: getAllowedSelectionModes(state),
  coverageType: state.coverage.initializationParams.coverageType,
  groupKey: state.coverage.initializationParams.groupKey,
  useMarketableTechnologies: state.coverage.initializationParams.useMarketableTechnologies,
  useMaxSpeed: state.coverage.initializationParams.useMaxSpeed,
  coverageReport: state.coverage.report
})

const mapDispatchToProps = (dispatch) => ({
  setCoverageType: coverageType => dispatch(CoverageActions.setCoverageType(coverageType)),
  setGroupKeyType: groupKey => dispatch(CoverageActions.setGroupKeyType(groupKey)),
  setLimitMarketableTechnology: limitMarketableTechnology => dispatch(CoverageActions.setLimitMarketableTechnology(limitMarketableTechnology)),
  setLimitMaxSpeed: limitMaxSpeed => dispatch(CoverageActions.setLimitMaxSpeed(limitMaxSpeed)),
  setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
})

const CoverageInitializerComponent = wrapComponentWithProvider(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
