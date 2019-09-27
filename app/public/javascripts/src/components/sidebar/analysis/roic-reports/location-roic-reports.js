
class LocationRoicReportsController {
  constructor ($http, state, $ngRedux) {
    this.$http = $http
    this.state = state

    this.roicResultsData = null
    // this.roicPlanSettings = {
    //   analysis_type: 'LOCATION_ROIC',
    //   locationIds: locationIds,
    //   planId: planId,
    //   projectTemplateId: 1
    // }
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
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

  getLocationInfo (planId, id) {
    return this.$http.get(`/locations/${planId}/${id}/show`)// note: change this for a service endpoint?
      .then((result) => {
        var locationIds = []
        if (result.data.hasOwnProperty('locSourceIds')) {
          if (result.data.locSourceIds.hasOwnProperty('bizSourceIds') && result.data.locSourceIds.bizSourceIds.object_ids) {
            locationIds = locationIds.concat(result.data.locSourceIds.bizSourceIds.object_ids)
          }
          if (result.data.locSourceIds.hasOwnProperty('hhSourceIds') && result.data.locSourceIds.hhSourceIds.object_ids) {
            locationIds = locationIds.concat(result.data.locSourceIds.hhSourceIds.object_ids)
          }
          if (result.data.locSourceIds.hasOwnProperty('towerSourceIds') && result.data.locSourceIds.towerSourceIds.object_ids) {
            locationIds = locationIds.concat(result.data.locSourceIds.towerSourceIds.object_ids)
          }
        }

        this.roicPlanSettings = {
          'analysis_type': 'LOCATION_ROIC',
          'locationIds': locationIds,
          'planId': planId,
          'projectTemplateId': 1
        }
        this.refreshData()
      })
      .catch((err) => console.error(err))
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      planId: reduxState.plan.activePlan && reduxState.plan.activePlan.id,
      selectedLocations: reduxState.selection.locations
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }

  mergeToTarget (nextState, actions) {
    const oldSelectedLocations = this.selectedLocations

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if ((oldSelectedLocations !== this.selectedLocations)
        && (this.selectedLocations.size > 0)) {
      const firstSelectedLocationId = this.selectedLocations.values().next().value
      this.getLocationInfo(this.planId, firstSelectedLocationId)
    }
  }
}

LocationRoicReportsController.$inject = ['$http', 'state', '$ngRedux']

let locationRoicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports/common-roic-reports.html',
  bindings: {
    reportSize: '<'
  },
  controller: LocationRoicReportsController
}

export default locationRoicReports
