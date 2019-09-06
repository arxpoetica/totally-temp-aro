import Constants from '../../../common/constants'
import SelectionActions from '../../../../react/components/selection/selection-actions'

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
      })
      .catch((err) => console.error(err))
  }

  onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setSelectedLocations: locationIds => dispatch(SelectionActions.setLocations(locationIds))
    }
  }

  mergeToTarget (nextState, actions) {
    // const oldTransaction = this.currentTransaction
    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)
    console.log('nextState', nextState)
    console.log('actions', actions)
    // Why so complicated? Because in the first render, isPlanEditorActive will be false and we will exit plan edit mode.
    // So we only exit plan edit mode if isPlanEditorActive === false AND we have an older transaction. All this because
    // the plan editor (this component) closes itself after a commit/discard. Let it be for now, as this will move to React anyways.
    // if (!nextState.isPlanEditorActive && oldTransaction) {
    //   this.exitPlanEditMode() // The user did a commit or discard on the current transaction
    // } else if ((oldTransaction !== nextState.currentTransaction) && nextState.currentTransaction) {
    //   this.onCurrentTransactionChanged() // A new transaction was created
    // }
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
