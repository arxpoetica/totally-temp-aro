import { createSelector } from 'reselect'
import CoverageActions from '../../../../react/components/coverage/coverage-actions'
import SelectionActions from '../../../../react/components/selection/selection-actions'
import SelectionModes from '../../../../react/components/selection/selection-modes'

const getAllSelectionModes = state => state.selection.selectionModes
const getAllowedSelectionModes = createSelector([getAllSelectionModes],
  (selectionModes) => angular.copy(selectionModes.filter(item => item.id !== 'SELECTED_LOCATIONS')))

class CoverageInitializerController {
  constructor (state, $http, $timeout, $ngRedux) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
    this.coverageTypes = [
      { id: 'census_block', name: 'Form 477' },
      { id: 'location', name: 'Locations' }
    ]
    this.groupKeyTypes = [
      { id: 'serviceArea', name: 'Service Areas' },
      { id: 'networkNode', name: 'Network Nodes' },
      { id: 'location', name: 'Locations' }
    ]
    this.serviceAreas = []
    this.analysisAreas = []
    this.siteAssignments = ['Proximity', 'Incremental']
    this.selectedSiteAssignment = 'Proximity'
    this.SelectionModes = SelectionModes
  }

  // Map global state to component properties
  mapStateToThis (reduxState) {
    return {
      isSuperUser: reduxState.user.isSuperUser,
      activeSelectionModeId: reduxState.selection.activeSelectionMode.id,
      selectionModes: getAllowedSelectionModes(reduxState),
      coverageType: reduxState.coverage.initializationParams.coverageType,
      groupKeyType: reduxState.coverage.initializationParams.groupKeyType,
      useMarketableTechnologies: reduxState.coverage.initializationParams.useMarketableTechnologies,
      useMaxSpeed: reduxState.coverage.initializationParams.useMaxSpeed,
      coverageReport: reduxState.coverage.report
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setCoverageType: coverageType => dispatch(CoverageActions.setCoverageType(coverageType)),
      setGroupKeyType: groupKeyType => dispatch(CoverageActions.setGroupKeyType(groupKeyType)),
      setLimitMarketableTechnology: limitMarketableTechnology => dispatch(CoverageActions.setLimitMarketableTechnology(limitMarketableTechnology)),
      setLimitMaxSpeed: limitMaxSpeed => dispatch(CoverageActions.setLimitMaxSpeed(limitMaxSpeed)),
      setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  onSelectionTypeChange (selectionType) {
    this.setSelectionTypeById(selectionType)
  }

  removeServiceAreas (targets) {
    this.$http.post(`/service_areas/${this.state.plan.getValue().id}/removeServiceAreaTargets`, { serviceAreaIds: targets.map((sa) => sa.id) })
      .then(response => this.state.reloadSelectedServiceAreas())
      .catch(err => console.error(err))
  }

  removeAnalysisAreas (targets) {
    this.$http.post(`/analysis_areas/${this.state.plan.getValue().id}/removeAnalysisAreaTargets`, { analysisAreaIds: targets.map((sa) => sa.id) })
      .then(response => this.state.reloadSelectedAnalysisAreas())
      .catch(err => console.error(err))
  }
}

CoverageInitializerController.$inject = ['state', '$http', '$timeout', '$ngRedux']

let coverageInitializer = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-initializer.html',
  bindings: {
    selection: '<'
  },
  controller: CoverageInitializerController
}

export default coverageInitializer
