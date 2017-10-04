class NetworkAnalysisModalController {
  constructor(state) {
    this.state = state
  }

  onHideModal() {
    // The modal binds to the value of showNetworkAnalysisOutput. Set it to false so that the
    // next time it changes to "true" the modal will be shown.
    this.state.showNetworkAnalysisOutput.next(false)
  }
}

NetworkAnalysisModalController.$inject = ['state']

app.component('networkAnalysisModal', {
  template: `
    <modal visible="$ctrl.state.showNetworkAnalysisOutput.value" backdrop="static" on-hide="$ctrl.onHideModal()" >
      <modal-header title="Network Analysis"></modal-header>
      <modal-body>
        <network-analysis-output-content></network-analysis-output-content>
      </modal-body>
    </modal>
      `,
  bindings: {},
  controller: NetworkAnalysisModalController
})

