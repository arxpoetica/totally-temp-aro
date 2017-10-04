class NetworkAnalysisModalController {
  constructor(state) {
    this.state = state
  }
}

NetworkAnalysisModalController.$inject = ['state']

app.component('networkAnalysisModal', {
  template: `
    <modal visible="$ctrl.state.showNetworkAnalysisOutput.value" backdrop="static">
      <modal-header title="Network Analysis"></modal-header>
      <modal-body>
        <network-analysis-output-content></network-analysis-output-content>
      </modal-body>
    </modal>
      `,
  bindings: {},
  controller: NetworkAnalysisModalController
})

