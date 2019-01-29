import Constants from '../../common/constants'

class PlanSettingsController {
  constructor($scope, state, $timeout, tracker) {
    this.plan = {}
    //state.plan.subscribe((newPlan) => this.plan = newPlan)
    this.state = state
    this.currentUser = state.loggedInUser
    this.$timeout = $timeout
    this.areControlsEnabled = true
    
    tracker.trackEvent(tracker.CATEGORIES.ENTER_PLAN_SETTINGS_MODE, tracker.ACTIONS.CLICK)
    
    state.plan.subscribe((newPlan) => {
      this.plan = newPlan
      this.setControlsEnabled(newPlan)
      /*
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
      }
      */
    })

    state.planOptimization.subscribe((newPlan) => {
      this.setControlsEnabled(newPlan)
      /*
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
      }
      */
    })
    
  }
  
  
  setControlsEnabled(newPlan){
    if (newPlan) {
      this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
    }
  }
  
}

PlanSettingsController.$inject = ['$scope', 'state', '$timeout', 'tracker']

let planSettings = {
  templateUrl: '/components/sidebar/plan-settings/plan-settings.html',
  controller: PlanSettingsController
}

export default planSettings