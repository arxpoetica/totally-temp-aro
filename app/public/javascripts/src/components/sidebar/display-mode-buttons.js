import PlanActions from '../../react/components/plan/plan-actions'

class DisplayModeButtonsController {
  constructor (state, $ngRedux) {
    this.selectedDisplayModeSubject = state.selectedDisplayMode
    this.displayModes = state.displayModes
    this.currentUser = state.loggedInUser
    this.state = state

    // Data flow from state to component
    this.selectedDisplayModeSubject.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  // Data flow from component to state
  setSelectedDisplayMode (newMode) {
    this.selectedDisplayModeSubject.next(newMode)
    this.rSelectedDisplayModeAction(newMode)
  }

  mapStateToThis (reduxState) {
    return {
      rSelectedDisplayMode: reduxState.plan.rSelectedDisplayMode,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      rSelectedDisplayModeAction: (value) => dispatch(PlanActions.setSelectedDisplayMode(value))
    }
  }
}

DisplayModeButtonsController.$inject = ['state', '$ngRedux']

let displayModeButtons = {
  templateUrl: '/components/sidebar/display-mode-buttons.html',
  bindings: {},
  controller: DisplayModeButtonsController
}

export default displayModeButtons
