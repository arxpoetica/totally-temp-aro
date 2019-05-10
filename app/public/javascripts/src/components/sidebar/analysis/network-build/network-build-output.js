import ReportsActions from '../../../../react/components/optimization/reports/reports-actions'
class NetworkBuildOutputController {
  constructor ($ngRedux, state) {
    this.state = state
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  showDetailedOutput () {
    this.state.showRoicReportsModal = true
  }

  mapStateToThis (reduxState) {
    return {
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
  bindings: {},
  controller: NetworkBuildOutputController
}

export default networkBuildOutput
