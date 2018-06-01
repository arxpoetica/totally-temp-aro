class DisplayModeButtonsController {

  constructor(state) {
    this.selectedDisplayModeSubject = state.selectedDisplayMode
    this.displayModes = state.displayModes
    this.currentUser = state.loggedInUser

    // Data flow from state to component
    this.selectedDisplayModeSubject.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)
  }

  // Data flow from component to state
  setSelectedDisplayMode(newMode) {
    this.selectedDisplayModeSubject.next(newMode)
  }
}

DisplayModeButtonsController.$inject = ['state']

let displayModeButtons = {
  templateUrl: '/components/sidebar/display-mode-buttons.html',
  bindings: {},
  controller: DisplayModeButtonsController
}

export default displayModeButtons
