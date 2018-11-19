class ReportModalController {
  constructor($scope ,$http, state) {
    this.state = state
    this.analysis = []
    this.$http = $http

    this.plan
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.plan = newPlan
      }
    })
  }

  close() {
    this.state.reportModal.next(false)
    //this.state.previousModal.next(true)
  }

  modalShown() {
    this.state.reportModal.next(true)
    if(this.plan) {
      this.loadPlanReport()
    }
  }

  modalHide() {
    this.state.reportModal.next(false)
    //this.state.previousModal.next(true)
  }
  
  loadPlanReport(){
    this.analysis = []
    this.$http.get(`/service/installed/report/meta-data`).then((response) => {
      if (response.data){
        var reports = response.data
        
        var twoDigits = (d) => d > 9 ? String(d) : '0' + d
        var date = new Date()
        var now = `${date.getFullYear()}${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}`
        //var prefix = `${now}_${this.plan.id}_${this.plan.areaName}_`
        var prefix = `${now}_${this.plan.id}_`
        
        var analysis = []
        reports.forEach((report) => {
          analysis.push({
            name: `${prefix}${report.name}`,
            type: `.${report.mediaType}`,
            url: `/report-extended/${report.name}/${this.plan.id}/${report.mediaType}`
          })
        })
        this.analysis = analysis
      }
    }).catch((err) => {
      console.error(err)
    })
  }
}

ReportModalController.$inject = ['$scope', '$http', 'state']

let reportModal = {
  template: `
  <modal visible="$ctrl.state.reportModal.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
    <modal-header title="Reports"></modal-header>
      <modal-body style="max-height: 500px; overflow: scroll;">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Type</th>
              <th>Date Created</th>
              <th class="col-md-1"></th>
            </tr>
          </thead>
          <tbody>
            <tr ng-repeat="file in $ctrl.analysis">
              <td>{{ file.name }}</td>
              <td>{{ file.type }}</td>
              <td>{{ $ctrl.plan.updated_at | date:'shortDate' }}</td>
              <td>
                <a ng-show="file.url" href="{{ file.url }}" class="btn btn-primary btn-xs" download="{{ file.name }}{{ file.type }}">
                  <span class="fa fa-download"></span> Download
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </modal-body>
    <modal-footer>
      <button type="button" class="btn btn-light" disabled>Download all reports</button>
      <button type="button" class="btn btn-light" data-dismiss="modal">Close</button>
    </modal-footer>
  </modal>
  `,
  bindings: {},
  controller: ReportModalController
}

export default reportModal