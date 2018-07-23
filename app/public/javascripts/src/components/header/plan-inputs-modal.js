class PlanInputsModalController {
  constructor(state,$element) {
    this.state    = state
    this.$element = $element
    this.initModalData()
  }

  initModalData() {
    this.planName = null
    this.parentPlan = null
    this.parentPlanSelectorExpanded = false
  }

  close() {
    this.state.planInputsModal.next(false)
    this.initModalData()
  }

  modalShown() {
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
    this.close()
  }

  $onInit() {
    this.$element.find('#plan_inputs_modal > .modal-dialog').css('width', '350')
  }

}

PlanInputsModalController.$inject = ['state','$element']

let planInputsModal = {
  template: `
  <style scoped>
  .with-margin {
    margin-bottom: 5px;
  }
  </style>
  <modal id="plan_inputs_modal" visible="$ctrl.state.planInputsModal.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
    <modal-header title="Plan Inputs"></modal-header>
      <modal-body>
        <input class="form-control with-margin" type="text" ng-model="$ctrl.planName" placeholder="Plan Name">
        <div class="with-margin"> 
        <edit-plan-tag
          object-name="Tag"
          search-list="$ctrl.state.listOfTags"
          selected-list="$ctrl.state.currentPlanTags"></edit-plan-tag>
        </div>
        <edit-plan-tag
          object-name="Service Area"
          search-list="$ctrl.state.listOfServiceAreaTags"
          selected-list="$ctrl.state.currentPlanServiceAreaTags"
          refresh-tag-list="$ctrl.state.loadListOfSAPlanTags(searchObj)"></edit-plan-tag>
        <div ng-click="$ctrl.parentPlanSelectorExpanded = !$ctrl.parentPlanSelectorExpanded" style="margin-top: 10px; cursor: pointer;">
          Parent plan: {{$ctrl.parentPlan ? $ctrl.parentPlan.name : '(undefined)'}}
          <div class="pull-right"><i ng-class="{ 'fa': true, 'fa-plus': !$ctrl.parentPlanSelectorExpanded, 'fa-minus': $ctrl.parentPlanSelectorExpanded }"></i></div>
        </div>
        <div ng-style="{ 'margin-left': '30px;', 'display': $ctrl.parentPlanSelectorExpanded ? 'block' : 'none' }">
          <plan-search show-plan-delete-button="false"
                      show-refresh-plans-on-map-move="false"
                      on-plan-selected="$ctrl.onParentPlanSelected(plan)">
          </plan-search>
        </div>
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