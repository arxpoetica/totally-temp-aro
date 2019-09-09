import SelectionActions from '../../../react/components/selection/selection-actions'

class ViewModeController {
  constructor (state, $http, $ngRedux) {
    this.state = state
    this.$http = $http
    this.currentUser = state.loggedInUser
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  onSearchResult (selectedLocation) {
    this.setSelectedLocations([selectedLocation.id])
  }

  updateSelectedState (locationId) {
    // This is legacy code from the old AngularJS location-detail.js. This will show a selection circle
    // around the selected location.
    if (!this.state.configuration.perspective) {
      return
    }
    if ((this.state.selectedDisplayMode.getValue() === this.state.displayModes.VIEW) &&
        (this.state.configuration.perspective.showViewModePanels[this.state.viewModePanels.LOCATION_INFO])) {
      var newSelection = this.state.cloneSelection()
      if (locationId) {
        newSelection.editable.location = {
          [locationId]: locationId
        }
      }
      this.state.selection = newSelection
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems,
      selectedLocations: reduxState.selection.locations
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setSelectedLocations: locationIds => dispatch(SelectionActions.setLocations(locationIds))
    }
  }

  mergeToTarget (nextState, actions) {
    const currentSelectedLocations = this.selectedLocations

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if (currentSelectedLocations !== nextState.selectedLocations) {
      const firstLocationId = nextState.selectedLocations.values().next().value
      this.updateSelectedState(firstLocationId)
    }
  }
}

ViewModeController.$inject = ['state', '$http', '$ngRedux']

let viewMode = {
  templateUrl: '/components/sidebar/view/view-mode.html',
  controller: ViewModeController
}

export default viewMode
