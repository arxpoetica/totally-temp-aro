import { batch } from 'react-redux'
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import PlanActions from '../../plan/plan-actions'
import SelectionActions from '../../selection/selection-actions'
import { handleError } from '../../../common/notifications'

function runOptimization(inputs, userId) { // shouldn't be getting userId from caller
  return (dispatch, getState) => {

    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
      payload: false,
    })

    const type = inputs.analysis_type === 'NETWORK_ANALYSIS' ? 'analyze' : 'optimize'
    AroHttp.post(`/service/v1/${type}/masterplan?userId=${userId}`, inputs)
      .then((response) => {
        batch(() => {
          dispatch({
            type: Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID,
            payload: response.data.optimizationIdentifier
          })
          dispatch(SelectionActions.loadPlanTargetSelectionsFromServer(response.data.planId))
        })
      })
      .catch(error => handleError(error))
  }
}

function cancelOptimization(planId, optimizationId) {
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
      .catch(error => {
        handleError(error)
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING,
          payload: false,
        })
      })
  }
}

function loadOptimizationInputs(planId) {
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
      .catch(error => handleError(error))
  }
}

function setOptimizationInputs(inputs) {
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

function setNetworkAnalysisType(networkAnalysisType) {
  return {
    type: Actions.NETWORK_OPTIMIZATION_SET_ANALYSIS_TYPE,
    payload: networkAnalysisType
  }
}

function copyEphemeralPlan(plan) {
  return async(dispatch) => {
    try {
      const { id, ephemeral} = plan
      const url = '/service/v1/plan-command/copy'
      const query = `?source_plan_id=${id}&is_ephemeral=${ephemeral}`
      const result = await AroHttp.post(url + query, {})
      dispatch(PlanActions.setActivePlan(result.data))
    } catch (error) {
      handleError(error)
    }
  }
}

function modifyOptimization(plan)  {
  return async(dispatch) => {
    try {
      await AroHttp.delete(`/service/v1/plan/${plan.id}/optimization-state`)
      const result = await AroHttp.get(`/service/v1/plan/${plan.id}/optimization-state`)
      dispatch(PlanActions.setActivePlanState(result.data))
    } catch (error) {
      handleError(error)
    }
  }
}

function loadFilters() {
  return (dispatch, getState) => {
    const state = getState()
    const client = state.configuration.system.ARO_CLIENT
    const dataType = 'location'

    AroHttp.get(`service/meta-data/${dataType}/properties?client=${client}`)
      .then((res) => {
        // adding extra info for selecting later on
        const newFilters = res.data.map((filter) => {
          filter.value = filter.name
          filter.label = filter.displayName
          filter.operator = ''
          filter.value1 = ''
          filter.value2 = ''
          return filter
        })

        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_FILTERS,
          payload: newFilters,
        })
      })
  }
}

function setActiveFilters(filters) {
  return (dispatch) => {
    dispatch({
      type: Actions.NETWORK_OPTIMIZATION_SET_ACTIVE_FILTERS,
      payload: filters
    })
  }
}

function getLocationPreview(planId, updatedLocationConstraints) {
  return async(dispatch, getState) => {
    try {
      const { planTargets } = getState().selection
      const body = {
        planId,
        locationConstraints: updatedLocationConstraints,
      }
      batch(() => {
        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING,
          payload: true,
        })
        dispatch(SelectionActions.removePlanTargets(planId, { locations: planTargets.locations }))
        dispatch({
          type: Actions.SELECTION_SET_ACTIVE_MODE,
          payload: 'SELECTED_LOCATIONS',
        })
      })

      const { data } = await AroHttp.post('service/v1/optimize/location-preview', body)

      // FIXME: harry made a concession to give us `location_id` as `id` here.
      // FIXME: we need to stop using `location_id`
      // FIXME: however the rest of the tile layer system uses it all over the place,
      // FIXME: including the Node.js location routes and models which also need to
      // FIXME: be converted to GUIDs and to service API endpoints
      const locations = new Set()
      for (const item of data) {
        for (const ids of item.ids) {
          locations.add(ids.id)
        }
      }
      dispatch(SelectionActions.addPlanTargets(planId, {
        locations: [...locations],
        serviceAreas: [],
        analysisAreas: [],
        allServiceAreas: [],
      }))
      dispatch({
        type: Actions.NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING,
        payload: false,
      })

    } catch (error) {
      handleError(error)
      dispatch({
        type: Actions.NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING,
        payload: false,
      })
    }
  }
}

function setIsPreviewLoading(isPreviewLoading) {
  return {
    type: Actions.NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING,
    payload: isPreviewLoading
  }
}

function getEnumOptions(propertyName) {
  return async(dispatch, getState) => {
    try {
      const state = getState()
      const client = state.configuration.system.ARO_CLIENT
      const currentOptions = state.optimization.networkOptimization.enumOptions
      const dataType = 'location' //hardcoded for now

      if(!currentOptions[propertyName]){
        const { data } = await AroHttp.get(`service/meta-data/${dataType}/properties/${propertyName}?client=${client}`)

        const enumOptions = {[propertyName]: data}

        dispatch({
          type: Actions.NETWORK_OPTIMIZATION_ADD_ENUM_OPTIONS,
          payload: enumOptions,
        })
      }
    } catch (error) {
      handleError(error)
    }
  }
}

export default {
  loadOptimizationInputs,
  setOptimizationInputs,
  runOptimization,
  cancelOptimization,
  setNetworkAnalysisType,
  copyEphemeralPlan,
  modifyOptimization,
  loadFilters,
  setActiveFilters,
  getLocationPreview,
  setIsPreviewLoading,
  getEnumOptions,
}
