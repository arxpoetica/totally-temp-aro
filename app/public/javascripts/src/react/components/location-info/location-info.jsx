import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
// import { createSelector } from 'reselect'
// import reduxStore from '../../../redux-store'
// import wrapComponentWithProvider from '../../common/provider-wrapped-component'
// import CoverageActions from './coverage-actions'
// import SelectionActions from '../selection/selection-actions'
// import PlanTargetList from '../selection/plan-target-list.jsx'

export class LocationInfo extends Component {
  constructor (props) {
    super(props)
  }
  
  render () {
    return <div>
      <table id='table-coverage-initializer' className='table table-sm table-striped sidebar-options-table'>
        <tbody>

          {/* Coverage type */}
          <tr>
            <td>Name</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Address</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Latitude</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Longitude</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Census Block</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>HouseHold Count</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>HouseHold IDs</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Business Count</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Tower Count</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Distance From Existing Network</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Distance from Planned Network</td>
            <td>
             kk
            </td>
          </tr>
        </tbody>
      </table>

     
    </div>
  }
}

// CoverageInitializer.propTypes = {
//   activeSelectionModeId: PropTypes.string,
//   selectionModes: PropTypes.array,
//   coverageType: PropTypes.string,
//   groupKeyType: PropTypes.string,
//   useMarketableTechnologies: PropTypes.bool,
//   useMaxSpeed: PropTypes.bool,
//   useExistingFiber: PropTypes.bool,
//   usePlannedFiber: PropTypes.bool,
//   coverageReport: PropTypes.object
// }

// const getAllSelectionModes = state => state.selection.selectionModes
// const getAllowedSelectionModes = createSelector([getAllSelectionModes],
//   (selectionModes) => selectionModes.filter(item => item.id !== 'SELECTED_LOCATIONS'))

// const mapStateToProps = state => ({
//   activeSelectionModeId: state.selection.activeSelectionMode.id,
//   selectionModes: getAllowedSelectionModes(state),
//   coverageType: state.coverage.initializationParams.coverageType,
//   groupKeyType: state.coverage.initializationParams.groupKeyType,
//   useMarketableTechnologies: state.coverage.initializationParams.useMarketableTechnologies,
//   useMaxSpeed: state.coverage.initializationParams.useMaxSpeed,
//   useExistingFiber: state.coverage.initializationParams.useExistingFiber,
//   usePlannedFiber: state.coverage.initializationParams.usePlannedFiber,
//   coverageReport: state.coverage.report
// })

// const mapDispatchToProps = (dispatch) => ({
//   setCoverageType: coverageType => dispatch(CoverageActions.setCoverageType(coverageType)),
//   setGroupKeyType: groupKeyType => dispatch(CoverageActions.setGroupKeyType(groupKeyType)),
//   setLimitMarketableTechnology: limitMarketableTechnology => dispatch(CoverageActions.setLimitMarketableTechnology(limitMarketableTechnology)),
//   setLimitMaxSpeed: limitMaxSpeed => dispatch(CoverageActions.setLimitMaxSpeed(limitMaxSpeed)),
//   setExistingFiber: existingFiber => dispatch(CoverageActions.setExistingFiber(existingFiber)),
//   setPlannedFiber: plannedFiber => dispatch(CoverageActions.setPlannedFiber(plannedFiber)),
//   setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
// })

//const CoverageInitializerComponent = wrapComponentWithProvider(reduxStore, CoverageInitializer, mapStateToProps, mapDispatchToProps)
export default LocationInfo
