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
  setSelectedDisplayMode (newMode, component) {
    const context = component ? component : this;

    context.selectedDisplayModeSubject.next(newMode || context.displayModes.EDIT_PLAN)
    context.rSelectedDisplayModeAction(newMode || context.displayModes.EDIT_PLAN)
  }

  disableEditPlanIcon() {
    return (
      // Disable if no plan present
      !!(!this.state.plan ||
      this.state.plan.ephemeral ||
      // Disable if plan has not been ran
      this.state.plan.planState === 'START_STATE' ||
      (
        // TEMPORARY UNTIL WE ALLOW MULTIPLE SERVICE AREA PLAN EDIT
        // Disable if there is more than 1 service area in a plan
        this.state.selection.planTargetDescriptions &&
        Object.keys(this.state.selection.planTargetDescriptions.serviceAreas) > 1
      ))
    )
  }

  editPlanToolTipText() {
    let baseMessage = "Edit mode is only available for "
    if (!this.state.plan || this.state.plan.ephemeral) {
      baseMessage += "a plan that has been created and ran."
    } else if (this.state.plan.planState === 'START_STATE') {
      baseMessage += "a plan that has been ran."
    } else if (
      this.state.selection.planTargetDescriptions &&
      Object.keys(this.state.selection.planTargetDescriptions.serviceAreas) > 1
    ) {
      baseMessage += "one service area at a time."
    } else {
      baseMessage = "";
    }

    return baseMessage;
  }

  editPlanButton() {
    const className = `btn display-mode-button ${this.rSelectedDisplayMode !== this.displayModes.EDIT_PLAN && 'btn-light'} ${this.rSelectedDisplayMode === this.displayModes.EDIT_PLAN && 'btn-primary'}`;

    return `<button type="button" class="${className}" ${this.disableEditPlanIcon() ? "disabled" : ""}> <div class='fa fa-2x fa-pencil-alt' data-toggle="tooltip" data-placement="bottom" title="Edit Plan" > </div> </button>`
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
