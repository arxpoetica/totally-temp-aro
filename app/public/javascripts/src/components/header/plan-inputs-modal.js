class PlanInputsModalController {
  constructor(state,$element) {
    this.state    = state
    this.$element = $element
    this.planName = null
  }

  close() {
    this.state.planInputsModal.next(false)
  }

  modalShown() {
    this.state.planInputsModal.next(true)
  }

  modalHide() {
    this.state.planInputsModal.next(false)
  }

  savePlanAs() {
    var currentPlan = this.state.plan.getValue()
    if (currentPlan.ephemeral) {
      if (this.planName) {
        this.state.makeCurrentPlanNonEphemeral(this.planName)
        this.resetPlanInputs()
      }
    } else {
      if (this.planName) {
        this.state.copyCurrentPlanTo(this.planName)
        this.resetPlanInputs()
      }
    }
  }

  resetPlanInputs() {
    this.planName = null
    this.state.currentPlanTags = []
    this.close()
  }

  $onInit() {
    this.$element.find('#plan_inputs_modal > .modal-dialog').css("width","300")
  }

}

PlanInputsModalController.$inject = ['state','$element']

let planInputsModal = {
  template: `
  <modal id="plan_inputs_modal" visible="$ctrl.state.planInputsModal.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
    <modal-header title="Plan Inputs"></modal-header>
      <modal-body>
        <input class="form-control" style="margin-bottom:5px" type="text" ng-model="$ctrl.planName" placeholder="Plan Name">
        <aro-multi-select 
          model="$ctrl.state.currentPlanTags" 
          all-items="$ctrl.state.listOfTags" 
          current-selected-items="$ctrl.state.currentPlanTags"
          selection-changed="$ctrl.onTagSelectionChanged()"
          enable-search = "true"
          placeholder="add tags">
        </aro-multi-select>
      </modal-body>
    <modal-footer>
      <button class="btn btn-primary pull-left" ng-click="$ctrl.savePlanAs()">Create Plan</button>
      <button class="btn btn-danger pull-right" ng-click="$ctrl.close()">Cancel</button>
    </modal-footer>
  </modal>
  `,
  bindings: {},
  controller: PlanInputsModalController
}

export default planInputsModal