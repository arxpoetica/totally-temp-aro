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
        console.log(response)
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
        // locationConstraints.locationTypes
        var layerKeys = []
        if (response.data.locationConstraints && response.data.locationConstraints.locationTypes) {
          response.data.locationConstraints.locationTypes.forEach(plannerKey => {
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

        // ToDo: use batch(() => {
        dispatch(this.setOptimizationInputs(response.data))
        dispatch({
          type: Actions.LAYERS_SET_ALL_VISIBILITY_OFF,
          payload: {
            layerTypes: ['location']
          }
        })
        dispatch({
          type: Actions.LAYERS_SET_VISIBILITY_BY_KEY,
          payload: {
            layerKeys: layerKeys
          }
        })
        
        // to replace loadAlgorithmParametersFromBody
        // having issues with analysisLayerId
        /*
        if (response.data.locationConstraints
            && response.data.locationConstraints.analysisSelectionMode) {
          dispatch({
            type: Actions.SELECTION_SET_ACTIVE_MODE,
            payload: response.data.locationConstraints.analysisSelectionMode
          })

          if (response.data.locationConstraints.analysisSelectionMode === 'SELECTED_ANALYSIS_AREAS'
              && response.data.locationConstraints.analysisLayerId) {
            // ToDo: what is analysisLayerId
            // state.setLayerVisibilityByKey
            
          //  dispatch({
          //    type: Actions.SELECTION_SET_ACTIVE_MODE,
          //    payload: response.data.locationConstraints.analysisSelectionMode
          //  })
            
          }
        }
        */

        // })
        // ToDo: sift through locations and turn on all in locations constraints, turn all others off
        console.log(response.data)
        // need batch
        // need to set ALL to false then select ones to true
        // so need list which is accross the line
        /*
        dispatch({
          type: Actions.LAYERS_SET_VISIBILITY_BY_KEY,
          payload: {
            layerType: 'location',
            plannerKey: '',
            visibility: true
          }
        })
        */
        
        // optimization.networkOptimization.optimizationInputs.locationConstraints.analysisSelectionMode
        // SelectionActions.setActiveSelectionMode
        /*
        dispatchers.setSelectionTypeById(postBody.locationConstraints.analysisSelectionMode)
        if (postBody.locationConstraints.analysisSelectionMode === 'SELECTED_ANALYSIS_AREAS') {
          // optimization.networkOptimization.optimizationInputs.locationConstraints.analysisLayerId
          state.setLayerVisibilityByKey('analysisLayerId', postBody.locationConstraints.analysisLayerId, true)
        }
        */
        
        // locationConstraints.locationTypes
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
