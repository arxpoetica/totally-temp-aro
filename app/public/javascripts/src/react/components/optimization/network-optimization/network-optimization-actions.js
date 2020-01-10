import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'

function runOptimization () {
  return (dispatch, getState) => {
    const state = getState()

    // tileDataService.markHtmlCacheDirty()
    // service.requestMapLayerRefresh.next(null)

    // Get the optimization options that we will pass to the server
    var optimizationInputs = state.optimization.networkOptimization.optimizationInputs
    // clone
    // optimizationInputs = JSON.parse(JSON.stringify(optimizationInputs))
    var userId = state.user.loggedInUser.id
    console.log(optimizationInputs)
    // Make the API call that starts optimization calculations on aro-service
    var apiUrl = `/service/v1/optimize/masterplan?userId=${userId}`
    AroHttp.post(apiUrl, optimizationInputs)
      .then((response) => {
        console.log(response)
        /*
        if (response.status >= 200 && response.status <= 299) {
          service.plan.optimizationId = response.data.optimizationIdentifier
          // service.startPolling()
          service.plan.planState = Constants.PLAN_STATE.STARTED
          service.progressPercent = 0
          service.startProgressMessagePolling(response.data.startDate)
          service.getOptimizationProgress(service.plan)
          service.setActivePlanState(PlanStates.START_STATE)
        } else {
          console.error(response)
        }
        */
        // dispatch(PlanActions.setActivePlanState(planState))
      })
  }
}

function loadOptimizationInputs () {
  return (dispatch, getState) => {
    const state = getState()
    var userId = state.user.loggedInUser.id
    var planId = state.plan.activePlan.id
    var apiUrl = `/service/v1/plan/${planId}/inputs?user_id=${userId}`
    AroHttp.get(apiUrl)
      .then((response) => {
        dispatch(this.setOptimizationInputs(response.data))
      })
  }
}

function setOptimizationInputs (inputs, autoPopulate = true) {
  return (dispatch, getState) => {
    if (autoPopulate) {
      const state = getState()
      inputs.planId = state.plan.activePlan.id
      // inputs.locationConstraints.locationTypes =
      // inputs.networkTypes =
      // inputs. = plan.selection.planTargets ???
    }

    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS,
      payload: inputs
    })
  }
}

export default {
  loadOptimizationInputs,
  setOptimizationInputs,
  runOptimization
}
