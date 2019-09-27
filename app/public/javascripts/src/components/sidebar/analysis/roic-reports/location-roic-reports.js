
class LocationRoicReportsController {
  constructor ($http, state, $ngRedux) {
    this.$http = $http
    this.state = state

    this.roicResultsData = null
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

  getLocationInfo (planId) {
    const locationInfoDetails = this.locationInfoDetails
    if (locationInfoDetails) {
      var locationIds = []
      if (locationInfoDetails.hasOwnProperty('locSourceIds')) {
        if (locationInfoDetails.locSourceIds.hasOwnProperty('bizSourceIds') && locationInfoDetails.locSourceIds.bizSourceIds.object_ids) {
          locationIds = locationIds.concat(locationInfoDetails.locSourceIds.bizSourceIds.object_ids)
        }
        if (locationInfoDetails.locSourceIds.hasOwnProperty('hhSourceIds') && locationInfoDetails.locSourceIds.hhSourceIds.object_ids) {
          locationIds = locationIds.concat(locationInfoDetails.locSourceIds.hhSourceIds.object_ids)
        }
        if (locationInfoDetails.locSourceIds.hasOwnProperty('towerSourceIds') && locationInfoDetails.locSourceIds.towerSourceIds.object_ids) {
          locationIds = locationIds.concat(locationInfoDetails.locSourceIds.towerSourceIds.object_ids)
        }
      }

      this.roicPlanSettings = {
        'analysis_type': 'LOCATION_ROIC',
        'locationIds': locationIds,
        'planId': planId,
        'projectTemplateId': 1
      }
      this.refreshData()
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      planId: reduxState.plan.activePlan && reduxState.plan.activePlan.id,
      selectedLocations: reduxState.selection.locations,
      locationInfoDetails: reduxState.locationInfo.details
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }

  mergeToTarget (nextState, actions) {
    const oldSelectedLocations = this.selectedLocations
    const oldLocationInfoDetails = this.locationInfoDetails

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    const hasSelectionChanged = (oldSelectedLocations !== this.selectedLocations)
    const haveAtLeastOneSelectedLocation = this.selectedLocations.size > 0
    const hasLocationInfoDetailsChanged = (oldLocationInfoDetails !== this.locationInfoDetails)
    if ((hasSelectionChanged || hasLocationInfoDetailsChanged) && haveAtLeastOneSelectedLocation) {
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
