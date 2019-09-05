import SelectionActions from '../../../react/components/selection/selection-actions'

class ViewModeController {
  constructor (state, $http, $ngRedux) {
    this.state = state
    this.$http = $http
    this.currentUser = state.loggedInUser
    this.roicPlanSettings = null
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  onSearchResult (selectedLocation) {
    this.setSelectedLocations([selectedLocation.id])
    this.getLocationInfo(this.state.plan.id, selectedLocation.id)
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
}

ViewModeController.$inject = ['state', '$http', '$ngRedux']

let viewMode = {
  templateUrl: '/components/sidebar/view/view-mode.html',
  controller: ViewModeController
}

export default viewMode
