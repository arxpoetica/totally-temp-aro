class NetworkAnalysisModalController {
  constructor (state) {
    this.state = state
  }

  onHideModal () {
    // The modal binds to the value of showNetworkAnalysisOutput. Set it to false so that the
    // next time it changes to "true" the modal will be shown.
    this.state.showNetworkAnalysisOutput = false
  }
}

NetworkAnalysisModalController.$inject = ['state']

let networkAnalysisModal = {
  template: `
    <modal visible="$ctrl.state.showNetworkAnalysisOutput" backdrop="static" on-hide="$ctrl.onHideModal()" >
      <modal-header title="Network Analysis"></modal-header>
      <modal-body>
        <!-- Use a ng-if on the output content, so that the component will be initialized when the modal is shown (this
             will then create and show the graph). Without this we have to explicitly ask Chart.js to render the graph -->
        <network-analysis-output-content ng-if="$ctrl.state.showNetworkAnalysisOutput"></network-analysis-output-content>
      </modal-body>
    </modal>
      `,
  bindings: {},
  controller: NetworkAnalysisModalController
}

export default networkAnalysisModal
