import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import PlanActions from '../../plan/plan-actions'

function runOptimization (inputs, userId) { // shouldn't be getting userId from caller
  return (dispatch, getState) => {
    // const state = getState()

    // tileDataService.markHtmlCacheDirty()
    // service.requestMapLayerRefresh.next(null)

    // Get the optimization options that we will pass to the server
    // var optimizationInputs = state.optimization.networkOptimization.optimizationInputs
    // clone
    // optimizationInputs = JSON.parse(JSON.stringify(optimizationInputs))
    // var userId = state.user.loggedInUser.id
    console.log(inputs)
    // Make the API call that starts optimization calculations on aro-service
    var apiUrl = `/service/v1/optimize/masterplan?userId=${userId}`
    if (inputs.analysis_type === 'NETWORK_ANALYSIS') apiUrl = `/service/v1/analyze/masterplan?userId=${userId}`

    AroHttp.post(apiUrl, inputs)
      .then((response) => {
        console.log(response)
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID,
          payload: response.data.optimizationIdentifier
        })
        // loadOptimizationInputs
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

function cancelOptimization (planId, optimizationId) {
  // ToDo: check that optimizationId is not null
  return (dispatch, getState) => {
    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
      payload: true
    })

    AroHttp.delete(`/service/optimization/processes/${optimizationId}`)
      .then((response) => {
        // Optimization process was cancelled. Get the plan status from the server
        //return AroHttp.get(`/service/v1/plan/${service.plan.id}`)
        // above is plan actions loadPlan
        return dispatch(PlanActions.loadPlan(planId))
      })
      .then((response) => {
        // ToDo: the following shouldn't run until load plan returns, but loadplan doesn't return a promise
        // service.isCanceling = false
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
          payload: false
        })
        
        //service.plan.planState = response.data.planState // Note that this should match with Constants.PLAN_STATE
        
        // delete service.plan.optimizationId
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_CLEAR_OPTIMIZATION_ID
        })
        
        //tileDataService.markHtmlCacheDirty()
        //service.requestMapLayerRefresh.next(null)
      })
      .catch((err) => {
        console.error(err)
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
          payload: false
        })
      })
  }
}

function loadOptimizationInputs (planId) {
  console.log(planId)
  // if (typeof planId === 'undefined') return {} ToDo: figure this out
  return (dispatch, getState) => {
    const state = getState()
    var userId = state.user.loggedInUser.id // need to put this somewhere else
    // var planId = state.plan.activePlan.id
    var apiUrl = `/service/v1/plan/${planId}/inputs?user_id=${userId}`
    AroHttp.get(apiUrl)
      .then((response) => {
        dispatch(this.setOptimizationInputs(response.data))
      })
  }
}

function setOptimizationInputs (inputs) {
  // weed out duplicate info?
  return {
    type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS,
    payload: inputs
  }
}

export default {
  loadOptimizationInputs,
  setOptimizationInputs,
  runOptimization,
  cancelOptimization
}
