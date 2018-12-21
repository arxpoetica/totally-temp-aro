class RoicReportsModalController {
  constructor($http, state, Utils) {
    this.$http = $http
    this.state = state
    this.Utils = Utils
  }

  close() {
    this.state.showRoicReportsModal = false
  }

  downloadReport() {
    // Run the export endpoint
    this.$http.get(`/financial_profile/${this.state.plan.getValue().id}/export`)
    .then((r)=>{
      if(r.data === ""){
        return swal({
          title: 'Error',
          text: 'No data returned',
          type: 'error'
        })
      }

      this.Utils.downloadCSV(r.data, `financial_profile_${new Date()}.csv`)
    })
    .catch((err) => console.error(err))
  }
}

RoicReportsModalController.$inject = ['$http', 'state', 'Utils']

let roicReportsModal = {
  template: `
  <modal visible="$ctrl.state.showRoicReportsModal" backdrop="static" modal-size="'modal-lg'">
    <modal-header title="ROIC Reports">
      <h2 class="mb-0">ROIC Reports</h2>
      <div class="float-right">
        <button class="btn btn-light" ng-click="$ctrl.close()"> X </button></modal-header>
      </div>
    </modal-header>
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