class ReportModalController {
  constructor ($timeout, $http, state, Utils) {
    this.$timeout = $timeout
    this.$http = $http
    this.state = state
    this.Utils = Utils
    this.reports = []
    state.plan.skip(1).subscribe((newPlan) => {
      var a = 0
      this.plan = newPlan
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
    var twoDigits = (d) => d > 9 ? String(d) : '0' + d
    var date = new Date()
    var now = `${date.getFullYear()}${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}`
    var downloadPrefix = `${now}_${this.plan.id}_`
    this.reports = []
    this.$http.get(`/service/v2/installed/report/meta-data`)
      .then((response) => {
        this.reports = response.data
          .filter(item => (item.reportType === 'GENERAL') || (item.reportType === 'PARAM_QUERY'))
          .map(report => {
            // Add some properties to the report object
            return { ...report,
              selectedFileType: report.media_types[0],
              downloadFilename: `${downloadPrefix}_${report.name}`
            }
          })
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  downloadReport (report) {
    const filename = `${report.downloadFilename}.${report.selectedFileType}`
    // We need { responseType: 'arraybuffer' } to receive binary data.
    this.$http.get(`/service-download-file/${filename}/v2/report-extended/${report.id}/${this.plan.id}.${report.selectedFileType}`, { responseType: 'arraybuffer' })
      .then(result => {
        this.Utils.downloadFile(result.data, filename)
      })
      .catch(err => console.error(err))
  }
}

ReportModalController.$inject = ['$timeout', '$http', 'state', 'Utils']

let reportModal = {
  templateUrl: '/components/header/report-modal.html',
  bindings: {},
  controller: ReportModalController
}

export default reportModal
