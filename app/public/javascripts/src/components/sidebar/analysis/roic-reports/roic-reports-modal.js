class RoicReportsModalController {
  constructor ($http, state, Utils) {
    this.$http = $http
    this.state = state
    this.Utils = Utils
  }

  close () {
    this.state.showRoicReportsModal = false
  }
}

RoicReportsModalController.$inject = ['$http', 'state', 'Utils']

let roicReportsModal = {
  template: `
  <modal visible="$ctrl.state.showRoicReportsModal" backdrop="static" modal-size="'modal-lg'">
    <modal-header title="Financial Details">
      <h2 class="mb-0">Financial Details</h2>
      <div class="float-right">
        <button class="btn btn-light" ng-click="$ctrl.close()"> X </button></modal-header>
      </div>
    </modal-header>
    <modal-body style="height: 500px;">
      <network-build-roic-reports ng-if="$ctrl.state.showRoicReportsModal"
                    plan-id="$ctrl.state.plan.id"
                    optimization-state="$ctrl.state.Optimizingplan.planState"
                    report-size="'large'">
      </network-build-roic-reports>
    </modal-body>
    <modal-footer>
      <button class="btn btn-primary" ng-click="$ctrl.close()">Close</button>
    </modal-footer>
  </modal>
  `,
  bindings: {},
  controller: RoicReportsModalController
}

export default roicReportsModal
