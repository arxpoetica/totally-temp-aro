class CoverageReportDownloaderController {
  constructor($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.Utils = Utils

    this.coverageReport = null
    this.rateReachMatrices = []
    this.selectedRateReachMatrix = null
    this.csvReports = []
    this.excelReports = []
    this.reportTypes = Object.freeze({
      INDIVIDUAL_CSV: 'INDIVIDUAL_CSV',
      CLUBBED_EXCEL: 'CLUBBED_EXCEL'
    })
    this.selectedReportType = this.reportTypes.INDIVIDUAL_CSV
  }

  $onInit() {
    // Get the coverage report details
    this.$http.get('/service/rr/matrix')
    .then((result) => {
      this.rateReachMatrices = result.data
      this.selectedRateReachMatrix = result.data[0]   // Now, this is not being set from the UI. Keeping it this way until the endpoints are stabilized.
      return this.$http.get('/service/installed/report/meta-data')
    })
    .then(result => {
      const now = new Date()
      const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
      this.excelReportFilename = `Consolidated_${timeStamp}.xls`
      const displayableReports = result.data.filter(item => item.reportType === 'COVERAGE' || item.reportType === 'FORM477')
      displayableReports.forEach((item, index) => {
        displayableReports[index].mediaTypes = item.mediaTypes
        displayableReports[index].selectedMediaType = item.mediaTypes[0]
        displayableReports[index].downloadUrlPrefix = `/report-extended/${item.name}/${this.state.plan.getValue().id}`
        displayableReports[index].downloadFilenamePrefix = `Coverage_${timeStamp}`
        displayableReports[index].useInExcelDownload = false
      })
      this.csvReports = displayableReports.filter(item => item.mediaTypes.indexOf('csv') >= 0)
      this.excelReports = displayableReports.filter(item => item.mediaTypes.indexOf('xls') >= 0)
      this.$timeout()
    })
    .catch(err => console.error(err))
  }

  downloadReportCsv(report) {
    this.$http.get(`${report.downloadUrlPrefix}/csv`)
      .then(result => this.Utils.downloadCSV(result.data, `${report.downloadFilenamePrefix}.csv`))
      .catch(err => console.error(err))
  }

  downloadReportsExcel() {
    // We want a consolidated excel report with all the selected reports (each selected report will be in a new tab in the excel)
    const reportNames = this.excelReports.filter(item => item.useInExcelDownload)
                                         .map(item => item.name)

    this.$http.post(`/service/report-extended-queries/${this.state.plan.getValue().id}.xls`, reportNames)
      .then(result => this.Utils.downloadCSV(result.data, this.excelReportFilename))
      .catch(err => console.error(err))
  }
}

CoverageReportDownloaderController.$inject = ['$http', '$timeout', 'state', 'Utils']

let coverageReportDownloader = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-report-downloader.html',
  bindings: {},
  controller: CoverageReportDownloaderController
}

export default coverageReportDownloader
