/* globals */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'
import RfpStatusTypes from './constants'

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

function replaceTarget (indexToReplace, target) {
  return {
    type: Actions.RFP_REPLACE_TARGET,
    payload: {
      index: indexToReplace,
      target: target
    }
  }
}

function setSelectedTarget (selectedTarget) {
  return {
    type: Actions.RFP_SET_SELECTED_TARGET,
    payload: selectedTarget
  }
}

function initializeRfpReport (targets) {
  return dispatch => {
    const requestBody = {
      fiberRoutingMode: 'ROUTE_FROM_NODES',
      targets: targets.map(target => ({
        point: {
          type: 'Point',
          coordinates: [target.lng, target.lat]
        }
      }))
    }
    AroHttp.post(`/service/rfp/process`, requestBody)
      .then(result => console.log(result))
      .catch(err => console.error(err))

    dispatch({
      type: Actions.RFP_SET_STATUS,
      payload: RfpStatusTypes.RUNNING
    })
    setTimeout(() => {
      dispatch({
        type: Actions.RFP_SET_STATUS,
        payload: RfpStatusTypes.FINISHED
      })
    }, 5000)
  }
}

function modifyRfpReport () {
  return {
    type: Actions.RFP_SET_STATUS,
    payload: RfpStatusTypes.UNINITIALIZED
  }
}

export default {
  addTargets: addTargets,
  clearState: clearState,
  initialize: initialize,
  initializeRfpReport: initializeRfpReport,
  modifyRfpReport: modifyRfpReport,
  removeTarget: removeTarget,
  replaceTarget: replaceTarget,
  setSelectedTarget: setSelectedTarget,
  showOrHideRfpStatusModal: showOrHideRfpStatusModal
}
