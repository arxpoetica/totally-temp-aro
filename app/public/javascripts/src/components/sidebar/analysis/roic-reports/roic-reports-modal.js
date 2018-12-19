class RoicReportsModalController {
  constructor(state) {
    this.state    = state
  }

  close() {

    this.state.showRoicReportsModal = false
  }
}

RoicReportsModalController.$inject = ['state']

let roicReportsModal = {
  template: `
  <modal visible="$ctrl.state.showRoicReportsModal" backdrop="static" modal-size="'modal-lg'">
    <modal-header title="ROIC Reports"></modal-header>
      <modal-body style="height: 500px;">
        <roic-reports ng-if="$ctrl.state.showRoicReportsModal"
                      plan-id="$ctrl.state.plan.getValue().id"
                      optimization-state="$ctrl.state.Optimizingplan.planState"
                      report-size="'large'">
        </roic-reports>
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