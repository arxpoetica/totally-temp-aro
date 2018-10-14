class PlanSettingsController {
  constructor($scope, state, $timeout, tracker) {
    this.plan = {}
    state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.state = state
    this.currentUser = state.loggedInUser
    this.$timeout = $timeout
    tracker.trackEvent(tracker.CATEGORIES.ENTER_PLAN_SETTINGS_MODE, tracker.ACTIONS.CLICK)
  }
}

PlanSettingsController.$inject = ['$scope', 'state', '$timeout', 'tracker']

let planSettings = {
  templateUrl: '/components/sidebar/plan-settings/plan-settings.html',
  controller: PlanSettingsController
}

export default planSettings