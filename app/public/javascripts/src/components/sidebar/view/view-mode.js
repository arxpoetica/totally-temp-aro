import SelectionActions from '../../../react/components/selection/selection-actions'

class ViewModeController {
  constructor (state, $http, $ngRedux) {
    this.state = state
    this.$http = $http
    this.currentUser = state.loggedInUser
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  onSearchResult (selectedLocation) {
    this.setSelectedLocations([selectedLocation.id])
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
