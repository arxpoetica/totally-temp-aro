class SummaryReportsController {

  constructor(state, Utils, $http, $timeout) {
    this.state = state
    this.Utils = Utils
    this.$http = $http
    this.$timeout = $timeout
    this.downloads = {
      equipment: {
        caption: 'Export Equipment',
        url: '/reports/planSummary/{PLAN_ID}',
        fileName: 'planSummary.csv',
        isDownloading: false
      },
      location: {
        caption: 'Export Locations',
        url: '/reports/planSummary/{PLAN_ID}/{SELECTED_BOUNDARY_NAME}',
        fileName: 'Plan locations - {PLAN_NAME}.csv',
        isDownloading: false
      },
      kml: {
        caption: 'Export Site Boundaries',
        url: '/reports/planSummary/kml/{PLAN_ID}/{SELECTED_BOUNDARY_NAME}',
        fileName: 'Site boundaries - {SELECTED_BOUNDARY_NAME} - {PLAN_NAME}.kml',
        isDownloading: false
      }
    }
  }

  downloadReport(reportType) {
    // Substitute plan id, selected boundary name, etc
    const planId = this.state.plan.getValue().id
    const planName = this.state.plan.getValue().name
    const selectedBoundaryName = this.state.selectedBoundaryType.name

    this.downloads[reportType].url = this.downloads[reportType].url
                                      .replace('{PLAN_ID}', planId)
                                      .replace('{SELECTED_BOUNDARY_NAME}', selectedBoundaryName)
    this.downloads[reportType].fileName = this.downloads[reportType].fileName
                                           .replace('{PLAN_ID}', planId)
                                           .replace('{SELECTED_BOUNDARY_NAME}', selectedBoundaryName)
                                           .replace('{PLAN_NAME}', planName)

    this.downloads[reportType].isDownloading = true
    this.$http.get(this.downloads[reportType].url)
      .then((response) => {
        this.downloads[reportType].isDownloading = false
        this.$timeout()
        this.Utils.downloadFile(response.data, this.downloads[reportType].fileName)
      })
      .catch((err) => {
        console.error(err)
        this.downloads[reportType].isDownloading = false
        this.$timeout()
      })
  }
}

SummaryReportsController.$inject = ['state', 'Utils', '$http', '$timeout']

let summaryReports = {
  templateUrl: '/components/sidebar/summary-reports.html',
  controller: SummaryReportsController
}

export default summaryReports