class PlanInfoController {
  constructor(state) {
    this.state = state
    this.isEditMode = false

    state.plan
    .subscribe((plan) => {
      this.currentPlanInfo = plan
    })  
  }

  editCurrentPlan() {
    this.isEditMode = true
  }

  commitUpdatedtoPlan() {

  }
}

PlanInfoController.$inject = ['state']

let planInfo = {
  templateUrl: '/components/sidebar/view/plan-info.html',
  bindings: {
    currentUser: '<'
  },
  controller: PlanInfoController
}

export default planInfo