import AroHttp from '../../../common/aro-http'
import Actions from '../../../common/actions'
import PlanActions from '../../plan/plan-actions'

function setEnumStrings (enumStrings){
  return {
    type: Actions.ANALYSIS_MODE_ENUM_STRINGS,
    payload: enumStrings
  }
}

function loadNetworkNodeTypesEntity () {
  return dispatch => {
    return new Promise((resolve, reject) => {
      AroHttp.get('/service/odata/NetworkNodeTypesEntity')
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            var networkNodeTypesEntity = {}
            response.data.forEach((entityType) => {
              networkNodeTypesEntity[entityType.name] = entityType.description
            })
            dispatch({
              type: Actions.ANALYSIS_MODE_NETWORK_NODE_TYPE_ENTITY,
              payload: networkNodeTypesEntity
            })
            resolve()
          } else {
            reject(response)
          }
        })
    })
  }
}

  // optimization services
  var modifyDialogResult = Object.freeze({
    CANCEL: 0,
    OVERWRITE: 1
  })
  // expert mode refactor
  // also used by ring edit and r-network-optimization-input
  function handleModifyClicked(plan)  {
    return dispatch => {
      var currentPlan = plan
      if (currentPlan.ephemeral) {
        // This is an ephemeral plan. Don't show any dialogs to the user, simply copy this plan over to a new ephemeral plan
        var url = `/service/v1/plan-command/copy?source_plan_id=${currentPlan.id}&is_ephemeral=${currentPlan.ephemeral}`
        return AroHttp.post(url, {})
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              dispatch(PlanActions.setActivePlan(result.data))
              return Promise.resolve()
            }
          })
          .catch((err) => {
            console.log(err)
            return Promise.reject(err)
          })
      } else {
        // This is not an ephemeral plan. Show a dialog to the user asking whether to overwrite current plan or save as a new one.
        return showModifyQuestionDialog()
          .then((result) => {
            if (result === modifyDialogResult.OVERWRITE) {
              return AroHttp.delete(`/service/v1/plan/${currentPlan.id}/optimization-state`)
                .then(() => AroHttp.get(`/service/v1/plan/${currentPlan.id}/optimization-state`))
                .then(result => {
                  dispatch(PlanActions.setActivePlan(result.data))
                })
                .catch(err => console.error(err))
            }
          })
          .catch((err) => {
            console.log(err)
            return Promise.reject()
          })
      }
    }
  }

  function showModifyQuestionDialog() {
    return new Promise((resolve, reject) => {
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


function setSelectedExpertMode(selectedExpertMode){
  return {
    type: Actions.ANALYSIS_MODE_SELECTED_EXPERT_MODE,
    payload: selectedExpertMode
  }
}

function getExpertModeScopeContext(plan) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${plan.id}/scope-context`)
    .then((result) => {
      var expertModeScopeContext = result.data
      dispatch({
        type: Actions.ANALYSIS_MODE_EXPERT_MODE_SCOPE_CONTEXT,
        payload: expertModeScopeContext
      })
      dispatch(getAvailableScopeContextKeys(expertModeScopeContext))
    })
  }
}

var scopeContextKeys = []
function getAvailableScopeContextKeys (obj, parentKey) {
  return dispatch => {
    Object.keys(obj).forEach((key) => {
      if (obj[key] instanceof Object) {
        var superKey = parentKey == null ? key : parentKey + "." + key
        dispatch(getAvailableScopeContextKeys(obj[key], superKey))
      } else {
        parentKey == null ? scopeContextKeys.push(key) : scopeContextKeys.push(parentKey + "." + key)
      }
    })
    setTimeout(function(){ 
      dispatch({
        type: Actions.ANALYSIS_MODE_SUPER_CONTEXT_KEYS,
        payload: scopeContextKeys
      })
    }, 0);
  }
}

function setExpertMode(expertMode){
  return {
    type: Actions.ANALYSIS_MODE_EXPERT_MODE,
    payload: expertMode
  }
}

function setExpertModeTypes(expertModeTypes){
  return {
    type: Actions.ANALYSIS_MODE_EXPERT_MODE_TYPES,
    payload: expertModeTypes
  }
}

function setShowRoicReportsModal (showRoicReportsModal) {
  return {
    type: Actions.ANALYSIS_MODE_SHOW_ROIC_REPORT_MODAL,
    payload: showRoicReportsModal
  }
}

function loadROICResultsForPlan(planId) {
  return dispatch => {
    AroHttp.get(`/service/report/plan/${planId}`)
      .then(result => {
        dispatch({
          type: Actions.ANALYSIS_MODE_SET_ROIC_RESULTS_FOR_PLAN,
          payload: result.data
        })
      })
      .catch(err => console.error(err))
  }
}

function setXaxisLabels (xAxisLabels){
  return {
    type: Actions.ANALYSIS_MODE_SET_XAXIS_LABELS,
    payload: xAxisLabels
  }
}

export default {
  setEnumStrings,
  loadNetworkNodeTypesEntity,
  handleModifyClicked,
  setSelectedExpertMode,
  getExpertModeScopeContext,
  setExpertMode,
  setExpertModeTypes,
  setShowRoicReportsModal,
  loadROICResultsForPlan,
  setXaxisLabels
}