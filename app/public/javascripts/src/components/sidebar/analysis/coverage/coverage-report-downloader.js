import { timestamp } from "rxjs/operator/timestamp";

class CoverageReportDownloaderController {
  constructor($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.Utils = Utils

    this.coverageReport = null
    this.rateReachMatrices = []
    this.selectedRateReachMatrix = null
    // Get the coverage report details
    this.$http.get('/service/rr/matrix')
      .then((result) => {
        this.rateReachMatrices = result.data
        this.selectedRateReachMatrix = result.data[0]
        this.$timeout()
      })
      .catch(err => console.error(err))

    this.$http.get('/service/installed/report/meta-data')
      .then(result => {
        this.coverageReports = result.data.filter(item => item.reportType === 'COVERAGE')
        this.coverageReports.forEach((item, index) => {
          this.coverageReports[index].downloadUrl = `/report-extended/${item.name}/${this.state.plan.getValue().id}/${item.mediaType}`
          const now = new Date()
          const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
          this.coverageReports[index].downloadFilename = `Coverage_${timeStamp}.csv`
        })
      })
      .catch(err => console.error(err))
  }

  $onChanges(changesObj) {
    if (changesObj && changesObj.coverageReportId) {
      this.coverageReport = null
      this.$http.get(`/service/coverage/report/${this.coverageReportId}`)
        .then(result => {
          this.coverageReport = result.data
          this.$timeout()
        })
        .catch(err => console.error(err))
    }
  }

  downloadReportOld() {
    this.$http.get(`/service/coverage/query/form477/${this.coverageReportId}/${this.selectedRateReachMatrix.id}`)
      .then((result) => {
        const isEmptyResponse = (Object.keys(result.data || {}).length === 0)
        if (isEmptyResponse) {
          swal({
            title: 'Empty coverage report',
            text: 'We have an empty coverage report with the settings that you have selected',
            type: 'error',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'OK',
            closeOnConfirm: true
          })
        } else {
          this.Utils.downloadCSV(result.data, 'CoverageReport.csv')
        }
      })
      .catch(err => console.error(err))
  }

  downloadReport(report) {
    this.$http.get(report.downloadUrl)
      .then(result => this.Utils.downloadCSV(result.data, report.downloadFilename))
      .catch(err => console.error(err))
  }

  resetReportSettings() {
    this.$http.delete(`/service/coverage/report/${this.coverageReportId}`)
      .then(result => this.onReportSettingsReset())
      .catch(err => console.error(err))
  }
}

CoverageReportDownloaderController.$inject = ['$http', '$timeout', 'state', 'Utils']

let coverageReportDownloader = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-report-downloader.html',
  bindings: {
    coverageReportId: '<',
    onReportSettingsReset: '&'
  },
  controller: CoverageReportDownloaderController
}

export default coverageReportDownloader
