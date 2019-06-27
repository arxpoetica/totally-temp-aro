import ReportsActions from '../../../../react/components/optimization/reports/reports-actions'
class NetworkBuildOutputController {
  constructor ($ngRedux, state) {
    this.state = state
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    this.reportTypes = this.reportTypes || ['GENERAL', 'PARAM_QUERY']
  }

  showDetailedOutput () {
    this.state.showRoicReportsModal = true
  }

  mapStateToThis (reduxState) {
    console.log(reduxState)
    return {
      r_planState: reduxState.plan.activePlan.planState
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true))
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

NetworkBuildOutputController.$inject = ['$ngRedux', 'state']

let networkBuildOutput = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-output.html',
  bindings: {
    reportTypes: '<'
  },
  controller: NetworkBuildOutputController
}

export default networkBuildOutput
