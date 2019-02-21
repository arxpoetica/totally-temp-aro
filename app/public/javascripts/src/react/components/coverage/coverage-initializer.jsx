import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CoverageActions from './coverage-actions'
import SelectionActions from '../selection/selection-actions'

class CoverageInitializer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      coverageTypes: [
        { id: 'census_block', name: 'Form 477' },
        { id: 'location', name: 'Locations' }
      ],
      siteAssignments: ['Proximity', 'Incremental'],
      selectedSiteAssignment: 'Proximity'
    }
  }

  render () {
    return <div>
      <table id='table-coverage-initializer' ng-if='$ctrl.isSuperUser' className='table table-sm table-striped'>
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

          {/* Save site coverage */}
          {this.props.coverageType === 'location'
            ? <tr ng-if="$ctrl.coverageType === 'location'">
              <td>Save site coverage</td>
              <td>
                <input type='checkbox'
                  className='checkboxfill'
                  checked={this.props.saveSiteCoverage}
                  onChange={event => this.props.setSaveSiteCoverage(event.target.checked)} />
              </td>
            </tr>
            : null
          }

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
          {/* <tr ng-if="$ctrl.state.optimizationOptions.analysisSelectionMode === $ctrl.state.selectionModes.SELECTED_AREAS">
            <td>Selected Geographies({{$ctrl.serviceAreas.length || 0}})
              <a ng-if="$ctrl.serviceAreas.length > 0" ng-click="$ctrl.removeServiceAreas($ctrl.serviceAreas)">
                <span className="far fa-trash-alt trash"></span>
              </a>
            </td>
            <td>
              <p ng-hide="$ctrl.serviceAreas.length > 0"><em>No geographies selected</em></p>
              <show-targets targets="$ctrl.serviceAreas"
                            remove-target="$ctrl.removeServiceAreas(target)"></show-targets>
            </td>
          </tr>
          <tr ng-if="$ctrl.state.optimizationOptions.analysisSelectionMode === $ctrl.state.selectionModes.SELECTED_ANALYSIS_AREAS">
            <td>Selected Analysis Areas({{$ctrl.analysisAreas.length || 0}})
              <a ng-if="$ctrl.analysisAreas.length > 0" ng-click="$ctrl.removeAnalysisAreas($ctrl.analysisAreas)">
                <span className="far fa-trash-alt trash"></span>
              </a>
            </td>
            <td>
              <p ng-hide="$ctrl.analysisAreas.length > 0"><em>No analysis areas selected</em></p>
              <show-targets targets="$ctrl.analysisAreas"
                            remove-target="$ctrl.removeAnalysisAreas(target)" zoom-target="$ctrl.zoomTarget({target:$ctrl.targets})"></show-targets>
            </td>
          </tr> */}
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
  saveSiteCoverage: PropTypes.bool,
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
  saveSiteCoverage: state.coverage.initializationParams.saveSiteCoverage,
  useMarketableTechnologies: state.coverage.initializationParams.useMarketableTechnologies,
  useMaxSpeed: state.coverage.initializationParams.useMaxSpeed,
  coverageReport: state.coverage.report
})

const mapDispatchToProps = (dispatch) => ({
  setCoverageType: coverageType => dispatch(CoverageActions.setCoverageType(coverageType)),
  setSaveSiteCoverage: saveSiteCoverage => dispatch(CoverageActions.setSaveSiteCoverage(saveSiteCoverage)),
  setLimitMarketableTechnology: limitMarketableTechnology => dispatch(CoverageActions.setLimitMarketableTechnology(limitMarketableTechnology)),
  setLimitMaxSpeed: limitMaxSpeed => dispatch(CoverageActions.setLimitMaxSpeed(limitMaxSpeed)),
  setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
})

const CoverageInitializerComponent = wrapComponentWithProvider(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default CoverageInitializerComponent
