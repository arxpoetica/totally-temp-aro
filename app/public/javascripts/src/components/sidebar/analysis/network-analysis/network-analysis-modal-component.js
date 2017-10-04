class NetworkAnalysisModalController {

  constructor($scope, state) {
    this.state = state
    $scope.close = () => {
      state.showNetworkAnalysisOutput.next(false)
    }

    $scope.modalShown = () => {
      state.showNetworkAnalysisOutput.next(true)
    }

    $scope.modalHide = () => {
      state.showNetworkAnalysisOutput.next(false)
    }
  }
}

NetworkAnalysisModalController.$inject = ['$scope', 'state']

app.component('networkAnalysisModal', {
  template: `
    <modal visible="$ctrl.state.showNetworkAnalysisOutput.value" backdrop="static" on-show="modalShown()" on-hide="modalHide()" >
      <modal-header title="Network Analysis"></modal-header>
      <modal-body>
        <network-analysis-output-content target="network-analysis-chart-cash-flow"></network-analysis-output-content>
      </modal-body>
    </modal>
      `,
  bindings: {},
  controller: NetworkAnalysisModalController
})

