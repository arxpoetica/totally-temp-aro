import AroHttp from '../../../../common/aro-http'
import Actions from '../../../../common/actions'
import { batch } from 'react-redux'

function setEnumStrings (enumStrings) {
  return {
    type: Actions.ROIC_REPORTS_SET_ENUM_STRINGS,
    payload: enumStrings
  }
}

function loadNetworkNodeTypesEntity () {
  return dispatch => {
    AroHttp.get('/service/odata/NetworkNodeTypesEntity')
      .then((response) => {
        batch(() => {
          dispatch({
            type: Actions.ROIC_REPORTS_NETWORK_NODE_TYPES,
            payload: response.data
          })
          dispatch({
            type: Actions.ROIC_REPORTS_NETWORK_NODE_TYPE_ENTITY,
            payload: response.data
          })
        })
      })
  }
}

function setShowRoicReportsModal (showRoicReportsModal) {
  return {
    type: Actions.ROIC_REPORTS_SHOW_ROIC_REPORT_MODAL,
    payload: showRoicReportsModal
  }
}

function loadROICResultsForPlan (planId) {
  return dispatch => {
    AroHttp.get(`/service/report/plan/${planId}`)
      .then(result => {
        dispatch({
          type: Actions.ROIC_REPORTS_SET_ROIC_RESULTS_FOR_PLAN,
          payload: result.data
        })
      })
      .catch(err => console.error(err))
  }
}

function setXaxisLabels (xAxisLabels) {
  return {
    type: Actions.ROIC_REPORTS_SET_XAXIS_LABELS,
    payload: xAxisLabels
  }
}

function loadROICResultsForLocation (roicPlanSettings) {
  return (dispatch, getState) => {
    const state = getState()
    const userId = state.user.loggedInUser.id
    AroHttp.post(`/service/location-analysis/roic?userId=${userId}`, roicPlanSettings)
      .then(result => {
        dispatch({
          type: Actions.ROIC_REPORTS_SET_ROIC_RESULTS_FOR_LOCATION,
          payload: { roicAnalysis: result.data }
        })
      })
      .catch(err => console.error(err))
  }
}

export default {
  setEnumStrings,
  loadNetworkNodeTypesEntity,
  setShowRoicReportsModal,
  loadROICResultsForPlan,
  setXaxisLabels,
  loadROICResultsForLocation,
}
