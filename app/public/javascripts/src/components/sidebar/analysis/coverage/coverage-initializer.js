import { createSelector } from 'reselect'
import CoverageActions from '../../../../react/components/coverage/coverage-actions'
import SelectionActions from '../../../../react/components/selection/selection-actions'

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

    this.serviceAreas = []
    this.analysisAreas = []
    this.siteAssignments = ['Proximity', 'Incremental']
    this.selectedSiteAssignment = 'Proximity'
  }

  // Map global state to component properties
  mapStateToThis (state) {
    return {
      isSuperUser: state.user.isSuperUser,
      activeSelectionModeId: state.selection.activeSelectionMode.id,
      selectionModes: getAllowedSelectionModes(state),
      coverageType: state.coverage.initializationParams.coverageType,
      saveSiteCoverage: state.coverage.initializationParams.saveSiteCoverage,
      useMarketableTechnologies: state.coverage.initializationParams.useMarketableTechnologies,
      useMaxSpeed: state.coverage.initializationParams.useMaxSpeed,
      coverageReport: state.coverage.report
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setCoverageType: coverageType => dispatch(CoverageActions.setCoverageType(coverageType)),
      setSaveSiteCoverage: saveSiteCoverage => dispatch(CoverageActions.setSaveSiteCoverage(saveSiteCoverage)),
      setLimitMarketableTechnology: limitMarketableTechnology => dispatch(CoverageActions.setLimitMarketableTechnology(limitMarketableTechnology)),
      setLimitMaxSpeed: limitMaxSpeed => dispatch(CoverageActions.setLimitMaxSpeed(limitMaxSpeed)),
      setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  onSelectionTypeChange (selectionType) {
    // Hack - set the selection type in optimization options, then raise an event.
    // Temporary, since this is accessed throughout the code.
    this.state.optimizationOptions.analysisSelectionMode = selectionType
    this.state.selectionTypeChanged.next(selectionType)

    // Dispatch redux action
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

  $onChanges (changesObj) {
    if (changesObj.selection) {
      // The selected service areas have changed.
      var serviceAreaIds = Array.from(this.state.selection.planTargets.serviceAreaIds)
      this.$http.post('/network_plan/service_area/addresses', { serviceAreaIds: serviceAreaIds })
        .then((result) => {
          this.serviceAreas = result.data
        })
        .catch(err => console.error(err))

      // The selected analysis areas have changed.
      var analysisAreaIds = Array.from(this.state.selection.planTargets.analysisAreaIds)
      this.$http.post('/network_plan/analysis_area/addresses', { analysisAreaIds: analysisAreaIds })
        .then((result) => {
          this.analysisAreas = result.data
        })
        .catch(err => console.error(err))
    }
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
