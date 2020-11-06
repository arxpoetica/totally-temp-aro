import ToolBarActions from '../../react/components/header/tool-bar-actions'

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
      rSelectedDisplayMode: reduxState.toolbar.rSelectedDisplayMode,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      rSelectedDisplayModeAction: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
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
