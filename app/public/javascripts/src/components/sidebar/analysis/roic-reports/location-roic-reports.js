import Constants from '../../../common/constants'

class LocationRoicReportsController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state

    this.roicResultsData = null
    this.roicPlanSettings = {
      analysis_type: 'LOCATION_ROIC',
      locationIds: locationIds,
      planId: planId,
      projectTemplateId: 1
    }
  }

  $onChanges (changesObj) {
    if (changesObj.roicPlanSettings) {
      this.refreshData()
    }
  }

  refreshData () {
    if (!this.roicPlanSettings) {
      return
    }

    this.loadROICResultsForLocation()
  }

  loadROICResultsForLocation () {
    var userId = this.state.loggedInUser.id
    this.$http.post(`/service/location-analysis/roic?userId=${userId}`, this.roicPlanSettings)
      .then(result => {
        this.roicResultsData = { 'roicAnalysis': result.data }
      })
      .catch(err => console.error(err))
  }
}

LocationRoicReportsController.$inject = ['$http', 'state']

let locationRoicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports/common-roic-reports.html',
  bindings: {
    reportSize: '<'
  },
  controller: LocationRoicReportsController
}

export default locationRoicReports
