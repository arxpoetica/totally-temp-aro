/* globals */
import Actions from '../../../common/actions'

function initialize () {
  return {
    type: Actions.RFP_INITIALIZE
  }
}

function clearState () {
  return {
    type: Actions.RFP_CLEAR_STATE
  }
}

function showOrHideRfpStatusModal (showRfpStatusModal) {
  return {
    type: Actions.RFP_SHOW_HIDE_STATUS_MODAL,
    payload: showRfpStatusModal
  }
}

export default {
  initialize: initialize,
  clearState: clearState,
  showOrHideRfpStatusModal: showOrHideRfpStatusModal
}
