class PlanInputsModalController {
  constructor(state,$element,$http) {
    this.state    = state
    this.$element = $element
    this.$http = $http
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
    this.checkIfPlanNameExists()
    .then((planNameExists) => {
      if (!planNameExists) {
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
    })
  }

  checkIfPlanNameExists() {
    return new Promise((resolve, reject) => {
      // For frontier client check for duplicate plan name
      if(config.ARO_CLIENT === 'frontier'){
        var filter = `(name eq '${this.planName.replace(/'/g, "''")}') and (ephemeral eq false)`
        return this.$http.get(`/service/odata/PlanSummaryEntity?$select=id,name&$filter=${encodeURIComponent(filter)}&$top=20`)
        .then((result) => {
          if(result.data.length > 0){
            swal({
              title: 'Duplicate Plan Name',
              text: 'Plan name already exists, please enter a unique plan name',
              type: 'error' 
            })
          } else {
            resolve(false)
          }
        })
      } else {
        resolve(false)
      }
    })
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

PlanInputsModalController.$inject = ['state','$element','$http']

let planInputsModal = {
  templateUrl: '/components/header/plan-inputs-modal.html',
  bindings: {},
  controller: PlanInputsModalController
}

export default planInputsModal