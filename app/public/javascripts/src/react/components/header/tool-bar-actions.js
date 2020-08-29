import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'

function setPlanInputsModal (status){
  return dispatch => {
    dispatch({
      type: Actions.TOOL_BAR_SET_SAVE_PLAN_AS,
      payload: status
    })
  }
}

export default {
  setPlanInputsModal
}