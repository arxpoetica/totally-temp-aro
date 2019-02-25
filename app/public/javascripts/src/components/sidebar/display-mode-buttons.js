class DisplayModeButtonsController {
  constructor (state) {
    this.selectedDisplayModeSubject = state.selectedDisplayMode
    this.displayModes = state.displayModes
    this.currentUser = state.loggedInUser
    this.state = state

    // Data flow from state to component
    this.selectedDisplayModeSubject.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)

    // ToDo: this will be replaced by reading directly from configuration,
    //  once configuration is added to state and updated dynamically on state changes
    this.plan = null
    state.plan.subscribe((newValue) => {
      this.plan = newValue
    })
  }

  // Data flow from component to state
  setSelectedDisplayMode (newMode) {
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
