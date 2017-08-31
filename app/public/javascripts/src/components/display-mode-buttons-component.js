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
  template: `
    <style>
      .display-mode-button {
        width: 60px;   /* So that all the buttons have the same width */
      }
    </style>
    <div class="btn-group pull-left" role="group" aria-label="Mode buttons">
      <button type="button"
              ng-class="{ 'btn display-mode-button': true,
                          'btn-default': $ctrl.selectedDisplayMode !== $ctrl.displayModes.VIEW,
                          'btn-primary': $ctrl.selectedDisplayMode === $ctrl.displayModes.VIEW }"
              ng-click="$ctrl.setSelectedDisplayMode($ctrl.displayModes.VIEW)">
                <div class="fa fa-2x fa-eye"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="View Mode"></div>
      </button>
      <button type="button"
              ng-class="{ 'btn display-mode-button': true,
                          'btn-default': $ctrl.selectedDisplayMode !== $ctrl.displayModes.ANALYSIS,
                          'btn-primary': $ctrl.selectedDisplayMode === $ctrl.displayModes.ANALYSIS }"
              ng-click="$ctrl.setSelectedDisplayMode($ctrl.displayModes.ANALYSIS)">
                <div class="fa fa-2x fa-wrench"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="Analysis Mode"></div>
      </button>
    </div>
    <button type="button"
            ng-class="{ 'btn display-mode-button pull-right': true,
                        'btn-default': $ctrl.selectedDisplayMode !== $ctrl.displayModes.PLAN_SETTINGS,
                        'btn-primary': $ctrl.selectedDisplayMode === $ctrl.displayModes.PLAN_SETTINGS }"
            ng-click="$ctrl.setSelectedDisplayMode($ctrl.displayModes.PLAN_SETTINGS)">
              <div class="fa fa-2x fa-cog"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="Plan Settings Mode"></div>
    </button>
  `,
  bindings: {},
  controller: DisplayModeButtonsController
})

