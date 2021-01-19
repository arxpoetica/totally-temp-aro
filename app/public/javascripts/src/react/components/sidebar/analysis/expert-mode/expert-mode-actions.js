import AroHttp from '../../../../common/aro-http'
import Actions from '../../../../common/actions'

function setSelectedExpertMode (selectedExpertMode) {
  return {
    type: Actions.EXPERT_MODE_SELECTED_EXPERT_MODE,
    payload: selectedExpertMode
  }
}

function setExpertMode (expertMode) {
  return {
    type: Actions.EXPERT_MODE_SET_EXPERT_MODE,
    payload: expertMode
  }
}

function setExpertModeTypes (expertModeTypes) {
  return {
    type: Actions.EXPERT_MODE_SET_EXPERT_MODE_TYPES,
    payload: expertModeTypes
  }
}

function getExpertModeScopeContext (plan) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${plan.id}/scope-context`)
      .then((result) => {
        const expertModeScopeContext = result.data
        dispatch({
          type: Actions.EXPERT_MODE_GET_SCOPE_CONTEXT,
          payload: expertModeScopeContext
        })
        dispatch(getAvailableScopeContextKeys(expertModeScopeContext))
      })
  }
}

let scopeContextKeys = []
function getAvailableScopeContextKeys (obj, parentKey) {
  return dispatch => {
    Object.keys(obj).forEach((key) => {
      if (obj[key] instanceof Object) {
        const superKey = parentKey === undefined ? key : parentKey + '.' + key
        dispatch(getAvailableScopeContextKeys(obj[key], superKey))
      } else {
        parentKey === undefined ? scopeContextKeys.push(key) : scopeContextKeys.push(parentKey + '.' + key)
      }
    })
    setTimeout(function(){
      dispatch({
        type: Actions.EXPERT_MODE_GET_SUPER_CONTEXT_KEYS,
        payload: scopeContextKeys
      })
    }, 0);
  }
}

export default {
  setSelectedExpertMode,
  setExpertMode,
  setExpertModeTypes,
  getExpertModeScopeContext
}
