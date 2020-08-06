class NetworkPlanModalController {
  constructor (state) {
    this.state = state
    this.loadPlan = false
  }

  close () {
    this.state.networkPlanModal.next(false)
  }

  modalShown () {
    this.state.networkPlanModal.next(true)
  }

  modalHide () {
    this.state.networkPlanModal.next(false)
  }
}

NetworkPlanModalController.$inject = ['state']

let networkPlanModal = {
  template: `
  <modal visible="$ctrl.state.networkPlanModal.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
    <modal-header title="Network Plan"></modal-header>
      <modal-body>
        <network-plan-manage ng-if="$ctrl.state.networkPlanModal.value"></network-plan-manage>
      </modal-body>
    <modal-footer>
      <button class="btn btn-primary" ng-click="$ctrl.close()">Close</button>
    </modal-footer>
  </modal>
  `,
  bindings: {},
  controller: NetworkPlanModalController
}

export default networkPlanModal
