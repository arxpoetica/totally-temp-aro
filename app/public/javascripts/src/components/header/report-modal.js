class ReportModalController {
  constructor ($scope, $http, state) {
    this.state = state
    this.analysis = []
    this.$http = $http

    this.plan
    this.selectedFileType = {}
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.plan = newPlan
      }
    })
  }

  close () {
    this.state.reportModal.next(false)
    // this.state.previousModal.next(true)
  }

  modalShown () {
    this.state.reportModal.next(true)
    if (this.plan) {
      this.loadPlanReport()
    }
  }

  modalHide () {
    this.state.reportModal.next(false)
    // this.state.previousModal.next(true)
  }

  loadPlanReport () {
    this.analysis = []
    this.$http.get(`/service/installed/report/meta-data`).then((response) => {
      if (response.data) {
        var reports = response.data

        var twoDigits = (d) => d > 9 ? String(d) : '0' + d
        var date = new Date()
        var now = `${date.getFullYear()}${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}`
        // var prefix = `${now}_${this.plan.id}_${this.plan.areaName}_`
        var prefix = `${now}_${this.plan.id}_`

        var analysis = []
        reports.forEach((report) => {
          var reportName = `${prefix}${report.name}`
          this.selectedFileType[reportName] = report.mediaTypes[0] // Choose the first media type by default

          analysis.push({
            originalName: report.name,
            name: reportName,
            type: report.mediaTypes,
            url: `/report-extended/${report.name}/${this.plan.id}/${this.selectedFileType[reportName]}`
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
  templateUrl: '/components/header/report-modal.html',
  bindings: {},
  controller: ReportModalController
}

export default reportModal
