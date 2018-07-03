class DisplayModeButtonsController {

  constructor($scope, state, configuration) {
    this.selectedDisplayModeSubject = state.selectedDisplayMode
    this.displayModes = state.displayModes
    this.currentUser = state.loggedInUser
    $scope.configuration = configuration
    
    // Data flow from state to component
    this.selectedDisplayModeSubject.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)
  
    // ToDo: this will be replaced by reading directly from configuration, 
    //  once configuration is added to state and updated dynamically on state changes
    this.plan = null
    state.plan.subscribe((newValue) => {
      this.plan = newValue;
    })
  }

  // Data flow from component to state
  setSelectedDisplayMode(newMode) {
    this.selectedDisplayModeSubject.next(newMode)
  }
}

DisplayModeButtonsController.$inject = ['$scope' ,'state', 'configuration']

let displayModeButtons = {
  templateUrl: '/components/sidebar/display-mode-buttons.html',
  bindings: {},
  controller: DisplayModeButtonsController
}

export default displayModeButtons
