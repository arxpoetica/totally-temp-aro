class PlanInputsModalController {
  constructor(state,$element) {
    this.state    = state
    this.$element = $element
    this.initModalData()
  }

  initModalData() {
    this.planName = null
    this.parentPlan = null
    const currentPlan = this.state.plan.getValue()
    if (currentPlan && !currentPlan.isEphemeral) {
      // IF the current plan is not an ephemeral plan, then set it as the parent plan.
      this.parentPlan = currentPlan
    }
    this.parentPlanSelectorExpanded = false
  }

  close() {
    this.state.planInputsModal.next(false)
  }

  modalShown() {
    this.initModalData()
    this.state.planInputsModal.next(true)
  }

  modalHide() {
    this.state.planInputsModal.next(false)
    this.initModalData()
  }

  savePlanAs() {
    if (this.parentPlan) {
      // A parent plan is specified. Ignore the currently open plan, and just create a new one using
      // the selected plan name and parent plan
      this.state.createNewPlan(false, this.planName, this.parentPlan)
        .then((result) => this.state.loadPlan(result.data.id))
        .catch((err) => console.error(err))
    } else {
      // No parent plan specified
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
    this.close()
  }

  onParentPlanSelected(plan) {
    this.parentPlan = plan
    this.parentPlanSelectorExpanded = false
  }

  resetPlanInputs() {
    this.planName = null
    this.state.currentPlanTags = []
    this.state.currentPlanServiceAreaTags = []
    this.close()
  }

  clearParentPlan() {
    this.parentPlan = null
  }

  $onInit() {
    this.$element.find('#plan_inputs_modal > .modal-dialog').css('width', '350')
  }

}

PlanInputsModalController.$inject = ['state','$element']

let planInputsModal = {
  templateUrl: '/components/header/plan-inputs-modal.html',
  bindings: {},
  controller: PlanInputsModalController
}

export default planInputsModal