import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import PlanActions from '../../plan/plan-actions'
import { batch } from 'react-redux'

function runOptimization (inputs, userId) { // shouldn't be getting userId from caller
  return (dispatch, getState) => {
    // Make the API call that starts optimization calculations on aro-service
    var apiUrl = `/service/v1/optimize/masterplan?userId=${userId}`
    if (inputs.analysis_type === 'NETWORK_ANALYSIS') apiUrl = `/service/v1/analyze/masterplan?userId=${userId}`

    AroHttp.post(apiUrl, inputs)
      .then((response) => {
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID,
          payload: response.data.optimizationIdentifier
        })
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
      .catch((err) => {
        console.error(err)
      })
  }
}

function setOptimizationInputs (inputs) {
  return (dispatch) => {
    var layerKeys = []
    if (inputs.locationConstraints && inputs.locationConstraints.locationTypes) {
      inputs.locationConstraints.locationTypes.forEach(plannerKey => {
        // ToDo: bit of a hack here. once we standardize location keys we'll be able to pull out this translation
        var plannerKeyToKey = {
          'household': 'household',
          'celltower': 'celltower',
          'large': 'large_businesses',
          'medium': 'medium_businesses',
          'small': 'small_businesses'
        }
        var key = plannerKey
        if (plannerKeyToKey[plannerKey]) key = plannerKeyToKey[plannerKey]

        layerKeys.push({
          layerType: 'location',
          key: key,
          visibility: true
        })
      })
    }

    batch(() => {
      // set the actual options
      dispatch({
        type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS,
        payload: inputs
      })

      // location layer visibility: turn all off then turn selected ones on
      // this will not work with SSE sub-types/filters
      // so we'll comment this out until we can do sub-types properly
      /*
      dispatch({
        type: Actions.LAYERS_SET_ALL_VISIBILITY,
        payload: {
          layerTypes: ['location'],
          visibility: false
        }
      })
      
      // FOR TEST ONLY
      dispatch({
        type: Actions.LAYERS_SET_ALL_VISIBILITY,
        payload: {
          layerTypes: ['location'],
          visibility: true
        }
      })
      */
      if (layerKeys.length) {
        dispatch({
          type: Actions.LAYERS_SET_VISIBILITY_BY_KEY,
          payload: {
            layerKeys: layerKeys
          }
        })
      }

      // selection -> selection mode
      if (inputs.locationConstraints
          && inputs.locationConstraints.analysisSelectionMode) {
        dispatch({
          type: Actions.SELECTION_SET_ACTIVE_MODE,
          payload: inputs.locationConstraints.analysisSelectionMode
        })
      }
    })
  }
}

function setNetworkAnalysisType (networkAnalysisType) {
  return {
    type: Actions.NETWORK_OPTIMIZATION_SET_ANALYSIS_TYPE,
    payload: networkAnalysisType
  }
}

export default {
  loadOptimizationInputs,
  setOptimizationInputs,
  runOptimization,
  cancelOptimization,
  setNetworkAnalysisType
}
