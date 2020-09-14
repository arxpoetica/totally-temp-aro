import SelectionActions from '../../../react/components/selection/selection-actions'
import ToolBarActions from '../../../react/components/header/tool-bar-actions'

class ViewModeController {
  constructor (state, $http, $ngRedux) {
    this.state = state
    this.$http = $http
    this.currentUser = state.loggedInUser
    // Hook into a legacy system for clearing selection
    this.clearViewModeSubscription = state.clearViewMode.skip(1).subscribe(clear => {
      if (clear) {
        this.clearSelectedLocations() // Clear redux selection
        // Clear old state selection
        var newSelection = this.state.cloneSelection()
        newSelection.editable.location = {}
        this.state.selection = newSelection
      }
    })
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  // To set reduxState to Local State
  $onInit () {
    this.activeViewModePanel = this.rActiveViewModePanel
  }

  onSearchResult (selectedLocation) {
    this.setSelectedLocations([selectedLocation.id])
    this.$http.get(`/service/odata/LocationObjectEntity?$select=id,geom&$filter=id eq ${selectedLocation.id}&$top=1`)
      .then(result => {
        const location = result.data[0]
        this.state.requestSetMapCenter.next({
          latitude: location.geom.coordinates[1],
          longitude: location.geom.coordinates[0]
        })
        const ZOOM_FOR_LOCATION_SEARCH = 17
        this.state.requestSetMapZoom.next(ZOOM_FOR_LOCATION_SEARCH)
      })
      .catch(err => console.error(err))
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
    this.clearViewModeSubscription.unsubscribe()
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems,
      selectedLocations: reduxState.selection.locations,
      locationInfoDetails: reduxState.locationInfo.details,
      rActiveViewModePanel: reduxState.toolbar.rActiveViewModePanel,
      activeViewModePanel: reduxState.toolbar.rActiveViewModePanel,
      rSelectedTargetSelectionMode: reduxState.toolbar.selectedTargetSelectionMode,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setSelectedLocations: locationIds => dispatch(SelectionActions.setLocations(locationIds)),
      clearSelectedLocations: () => dispatch(SelectionActions.setLocations([])),
      rActiveViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value))
    }
  }

  mergeToTarget (nextState, actions) {
    const currentSelectedLocations = this.selectedLocations

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)
    if ((currentSelectedLocations !== nextState.selectedLocations) &&
      (this.state.activeViewModePanel !== this.state.viewModePanels.EDIT_LOCATIONS) &&
      (this.state.activeViewModePanel !== this.state.viewModePanels.EDIT_SERVICE_LAYER)) {
      const firstLocationId = nextState.selectedLocations.values().next().value
      this.updateSelectedState(firstLocationId)
      if (firstLocationId) {
        this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
      }
    }
  }
}

ViewModeController.$inject = ['state', '$http', '$ngRedux']

let viewMode = {
  templateUrl: '/components/sidebar/view/view-mode.html',
  controller: ViewModeController
}

export default viewMode
