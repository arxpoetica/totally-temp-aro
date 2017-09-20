class DisplayModeButtonsController {

  constructor(state) {
    this.selectedDisplayModeSubject = state.selectedDisplayMode
    this.displayModes = state.displayModes

    // Data flow from state to component
    this.selectedDisplayModeSubject.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)
  }

  // Data flow from component to state
  setSelectedDisplayMode(newMode) {
    this.selectedDisplayModeSubject.next(newMode)
  }
}

DisplayModeButtonsController.$inject = ['state']

app.component('displayModeButtons', {
  templateUrl: '/components/sidebar/display-mode-buttons-component.html',
  bindings: {},
  controller: DisplayModeButtonsController
})

