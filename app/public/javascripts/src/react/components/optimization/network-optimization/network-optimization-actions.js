import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import PlanActions from '../../plan/plan-actions'
import { batch } from 'react-redux'

function runOptimization(inputs, userId) { // shouldn't be getting userId from caller
  return (dispatch, getState) => {

    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
      payload: false,
    })

    const type = inputs.analysis_type === 'NETWORK_ANALYSIS' ? 'analyze' : 'optimize'
    AroHttp.post(`/service/v1/${type}/masterplan?userId=${userId}`, inputs)
      .then((response) => {
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID,
          payload: response.data.optimizationIdentifier
        })
      })
      .catch(err => console.log(err))
  }
}

function cancelOptimization (planId, optimizationId) {
  // TODO: check that optimizationId is not null
  return (dispatch, getState) => {
    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
      payload: true,
    })

    AroHttp.delete(`/service/optimization/processes/${optimizationId}`)
      .then((response) => {
        // Optimization process was cancelled. Get the plan status from the server
        return dispatch(PlanActions.loadPlan(planId))
      })
      .then((response) => {
        return dispatch({ type: Actions.NETWORK_OPTIMIZATION_CLEAR_OPTIMIZATION_ID })
      })
      .catch((err) => {
        console.error(err)
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
          payload: false,
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
          && inputs.locationConstraints.analysisSelectionMode
      ) {
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

// optimization services
const modifyDialogResult = Object.freeze({
  CANCEL: 0,
  OVERWRITE: 1
})

function modifyOptimization (plan)  {
  return dispatch => {
    const currentPlan = plan
    if (currentPlan.ephemeral) {
      // This is an ephemeral plan. 
      // Don't show any dialogs to the user, simply copy this plan over to a new ephemeral plan
      const url = `/service/v1/plan-command/copy?source_plan_id=${currentPlan.id}&is_ephemeral=${currentPlan.ephemeral}`
      return AroHttp.post(url, {})
        .then((result) => {
          dispatch(PlanActions.setActivePlan(result.data))
        })
        .catch((err) => {
          console.log(err)
        })
    } else {
      // This is not an ephemeral plan. 
      // Show a dialog to the user asking whether to overwrite current plan or save as a new one.
      return showModifyQuestionDialog()
        .then((resp) => {
          if (resp === modifyDialogResult.OVERWRITE) {
            return AroHttp.delete(`/service/v1/plan/${currentPlan.id}/optimization-state`)
              .then(() => AroHttp.get(`/service/v1/plan/${currentPlan.id}/optimization-state`))
              .then(result => {
                currentPlan.planState = result.data
                dispatch(PlanActions.setActivePlanState(result.data))
              })
              .catch(err => console.error(err))
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }
}

function showModifyQuestionDialog () {
  return new Promise((resolve) => {
    swal({
      title: '',
      text: 'You are modifying a plan with a completed analysis. Do you wish to overwrite the existing plan?  Overwriting will clear all results which were previously run.',
      type: 'info',
      confirmButtonColor: '#b9b9b9',
      confirmButtonText: 'Overwrite',
      cancelButtonColor: '#DD6B55',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
      closeOnConfirm: true
    }, (wasConfirmClicked) => {
      resolve(wasConfirmClicked ? modifyDialogResult.OVERWRITE : modifyDialogResult.CANCEL)
    })
  })
}

function loadFilters () {
  return (dispatch, getState) => {
    const state = getState()
    const client = state.configuration.system.ARO_CLIENT
    const dataType = 'location'

    AroHttp.get(`service/meta-data/${dataType}/properties?client=${client}`)
      .then((res) => {
        console.log(res)
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_FILTERS,
          payload: res.data,
        })
      })
  }
}

function setActiveFilters (filters) {
  return (dispatch) => {
    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_ACTIVE_FILTERS,
      payload: filters
    })
  }
}

export default {
  loadOptimizationInputs,
  setOptimizationInputs,
  runOptimization,
  cancelOptimization,
  setNetworkAnalysisType,
  modifyOptimization,
  loadFilters,
  setActiveFilters,
}
