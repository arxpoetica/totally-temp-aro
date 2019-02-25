import Constants from '../../../common/constants'

class LocationRoicReportsController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state

    this.roicResultsData = null
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
    /*
    var planSettings = {
      "analysis_type": "LOCATION_ROIC",
      "locationIds": [
        "5d7be43e-798c-11e8-b1ab-c772e0f1635c"
      ],
      "planId": 617,
      "projectTemplateId": 1
    }
    */
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
    roicPlanSettings: '<',
    reportSize: '<'
  },
  controller: LocationRoicReportsController
}

export default locationRoicReports
