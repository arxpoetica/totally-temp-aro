class OptimizeButtonController {
  constructor(state, $http, regions) {
    this.state = state
    this.$http = $http
    this.regions = regions
    this.selectedRegions = []
    this.modifyDialogResult = Object.freeze({
      SAVEAS: 0,
      OVERWRITE: 1
    })

    this.areInputsComplete = true
    this.plan = null
    state.plan.subscribe((newPlan) => {
      this.plan = newPlan;
    })
    this.progressMessage = ''
    this.progressPercent = 0
  }

  runOptimization() {
    var optimizationBody = this.state.getOptimizationBody()
    this.$http.post(`/service/v1/optimize/masterplan`, optimizationBody)
      .then((result) => console.log(result))
  }

  showModifyQuestionDialog() {
    return new Promise((resolve, reject) => {
      swal({
        title: '',
        text: 'You are modifying a plan with a completed analysis. Do you wish to save into a new plan or overwrite the existing plan?  Overwriting will clear all results which were previously run.',
        type: 'info',
        confirmButtonColor: '#b9b9b9',
        confirmButtonText: 'Save as',
        cancelButtonColor: '#DD6B55',
        cancelButtonText: 'Overwrite existing',
        showCancelButton: true,
        closeOnConfirm: false
      }, (wasConfirmClicked) => {
        resolve(wasConfirmClicked ? this.modifyDialogResult.SAVEAS : this.modifyDialogResult.OVERWRITE)
      })
    })
  }

  handleModifyClicked() {
    var currentPlan = this.state.plan.getValue()
    var userId = this.state.getUserId()
    if (currentPlan.ephemeral) {
      // This is an ephemeral plan. Don't show any dialogs to the user, simply copy this plan over to a new ephemeral plan
      var url = `/service/v1/plan-command/copy?user_id=${userId}&source_plan_id=${currentPlan.id}&is_ephemeral=${currentPlan.ephemeral}`
      this.$http.post(url, {})
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            this.state.setPlan(result.data)
          }
        })
        .catch((err) => console.log(err))
    } else {
      // This is not an ephemeral plan. Show a dialog to the user asking whether to overwrite current plan or save as a new one.
      this.showModifyQuestionDialog()
        .then((result) => {
          if (result === this.modifyDialogResult.SAVEAS) {
            // Ask for the name to save this plan as, then save it
            swal({
              title: 'Plan name required',
              text: 'Enter a name for saving the plan',
              type: 'input',
              showCancelButton: true,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Create Plan'
            },
            (planName) => {
              if (planName) {
                this.state.copyCurrentPlanTo(planName)
              }
            })
          } else if (result === this.modifyDialogResult.OVERWRITE) {
            // Overwrite the current plan. Delete existing results. Reload the plan from the server.
            this.$http.delete(`/service/v1/plan/${currentPlan.id}/analysis?user_id=${userId}`)
              .then((result) => this.state.loadPlan(currentPlan.id))
          }
        })
        .catch((err) => console.log(err))
    }
  }
}

OptimizeButtonController.$inject = ['state', '$http', 'regions']

app.component('optimizeButton', {
  template: `
    <!-- Show the "Run" button only if the current plan is in START_STATE or INITIALIZED state -->
    <button ng-if="$ctrl.plan.planState === 'START_STATE' || $ctrl.plan.planState === 'INITIALIZED'"
            ng-class="{ 'btn btn-block': true, 'btn-default': !$ctrl.areInputsComplete, 'btn-primary': $ctrl.areInputsComplete }"
            ng-click="$ctrl.runOptimization()">
      <i class="fa fa-bolt"></i> Run
    </button>

    <!-- Show the progress bar only if the current plan is in STARTED state -->
    <div ng-if="$ctrl.plan.planState === 'STARTED'"
         class="progress"
         style="height: 34px">
      <div class="progress-bar progress-bar-optimization"
           role="progressbar"
           aria-valuenow="$ctrl.progressPercent"
           aria-valuemin="0"
           aria-valuemax="100"
           ng-style="{ 'line-height': '34px', width: $ctrl.progressPercent + '%' }">
      </div>
    </div>
    <!-- A div overlaid on top of the progress bar, so we can always see the text. Lot of custom css! -->
    <div ng-if="$ctrl.plan.planState === 'STARTED'"
         style="position:relative; top:-47px; background-color: rgba(0, 0, 0, 0.4); color: white; width: 60px; text-align: center; border-radius: 3px; margin: auto; font-weight: bold">
      {{$ctrl.progressMessage}}
    </div>

    <!-- Show the modify button if the current plan is in COMPLETED, CANCELED or FAILED state -->
    <button ng-if="$ctrl.plan.planState === 'COMPLETED' || $ctrl.plan.planState === 'CANCELED' || $ctrl.plan.planState === 'FAILED'"
            class="btn btn-block modify-analysis-button"
            ng-click="$ctrl.handleModifyClicked()">
      Modify
    </button>

    <!-- A spacer div -->
    <div style="width: 100%; padding-bottom: 20px"></div>
  `,
  bindings: {},
  controller: OptimizeButtonController
})