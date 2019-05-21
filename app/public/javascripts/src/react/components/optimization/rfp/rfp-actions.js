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

function addTargets (targets) {
  return {
    type: Actions.RFP_ADD_TARGETS,
    payload: targets
  }
}

function removeTarget (indexToRemove) {
  return {
    type: Actions.RFP_REMOVE_TARGET,
    payload: indexToRemove
  }
}

function setSelectedTarget (selectedTarget) {
  return {
    type: Actions.RFP_SET_SELECTED_TARGET,
    payload: selectedTarget
  }
}

export default {
  addTargets: addTargets,
  clearState: clearState,
  initialize: initialize,
  removeTarget: removeTarget,
  setSelectedTarget: setSelectedTarget,
  showOrHideRfpStatusModal: showOrHideRfpStatusModal
}
