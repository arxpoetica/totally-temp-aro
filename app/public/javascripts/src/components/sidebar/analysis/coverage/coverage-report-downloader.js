class CoverageReportDownloaderController {
  constructor($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.Utils = Utils

    this.reports = []
    this.reportTypes = [
      { mediaType: 'xls', description: 'Excel'},
      { mediaType: 'csv', description: 'CSV' }
    ]
    this.selectedReportType = this.reportTypes.filter(item => item.mediaType === 'xls')[0]
    this.numReportsSelected = 0
  }

  $onInit() {
    // Get the coverage report details0
    this.$http.get('/service/installed/report/meta-data')
      .then(result => {
        const now = new Date()
        const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
        this.reportFilename = ''
        const allowedReportType = (this.state.coverage.report.coverageAnalysisRequest.coverageType === 'location') ? 'COVERAGE' : 'FORM477'
        this.reports = result.data.filter(item => item.reportType === allowedReportType)
        this.reports.forEach((item, index) => {
          this.reports[index].downloadUrlPrefix = `/report-extended/${item.name}/${this.state.plan.getValue().id}`
          this.reports[index].selectedForDownload = false
        })
        this.updateDownloadFilenameAndMediaType()
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  downloadReport() {
    // Note that we are not using the cached "this.numReportsSelected" here. That is for disabling buttons in the UI only.
    const selectedReports = this.reports.filter(item => item.selectedForDownload)
    const numReportsSelected = selectedReports.length
    if (numReportsSelected === 1) {
      // We are downloading an individual report.
      const downloadUrl = `${selectedReports[0].downloadUrlPrefix}/${this.selectedReportType.mediaType}`
      this.$http.get(downloadUrl)
        .then(result => this.Utils.downloadCSV(result.data, `${this.reportFilename}.${this.selectedReportType.mediaType}`))
        .catch(err => console.error(err))
    } else {
      // We are downloading multiple reports
      const reportNames = this.reports.filter(item => item.selectedForDownload)
                                      .map(item => item.name)

      this.$http.post(`/service/report-extended-queries/${this.state.plan.getValue().id}.xls`, reportNames)
        .then(result => this.Utils.downloadCSV(result.data, `${this.reportFilename}.${this.selectedReportType.mediaType}`))
        .catch(err => console.error(err))
    }
  }

  updateDownloadFilenameAndMediaType() {
    const now = new Date()
    const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
    this.numReportsSelected = this.reports.filter(item => item.selectedForDownload).length
    if (this.numReportsSelected === 0) {
      this.reportFilename = ''
    } else if (this.numReportsSelected === 1) {
      const selectedReport = this.reports.filter(item => item.selectedForDownload)[0]
      this.reportFilename = `${selectedReport.name}_${timeStamp}`
      this.reportTypes = [
        { mediaType: 'xls', description: 'Excel'},
        { mediaType: 'csv', description: 'CSV' }
      ]
      this.selectedReportType = this.reportTypes[0]
    } else if (this.numReportsSelected > 1) {
      // If multiple reports are selected, then we can only have an Excel download
      this.reportFilename = `Consolidated_${timeStamp}`
      this.reportTypes = [
        { mediaType: 'xls', description: 'Excel'}
      ]
      this.selectedReportType = this.reportTypes[0]
    }
  }
}

CoverageReportDownloaderController.$inject = ['$http', '$timeout', 'state', 'Utils']

let coverageReportDownloader = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-report-downloader.html',
  bindings: {},
  controller: CoverageReportDownloaderController
}

export default coverageReportDownloader
