import Actions from '../../../common/actions'
import RfpStatusTypes from './constants'

const defaultState = {
  options: {
    fiberRoutingMode: {
      displayName: 'Fiber routing mode',
      value: 'ROUTE_FROM_FIBER'
    }
  },
  targets: [],
  clickMapToAddTarget: false,
  selectedTarget: null,
  showRfpStatusModal: false,
  status: RfpStatusTypes.UNINITIALIZED
}

function clearState () {
  return JSON.parse(JSON.stringify(defaultState))
}

function setRfpStatusModalVisibility (state, showRfpStatusModal) {
  return { ...state,
    showRfpStatusModal: showRfpStatusModal
  }
}

function addTargets (state, targets) {
  return { ...state,
    targets: state.targets.concat(targets)
  }
}

function removeTarget (state, index) {
  var newTargets = [].concat(state.targets)
  newTargets.splice(index, 1)
  return { ...state,
    targets: newTargets
  }
}

function replaceTarget (state, index, target) {
  var newTargets = [].concat(state.targets)
  newTargets.splice(index, 1, target)
  return { ...state,
    targets: newTargets
  }
}

function setSelectedTarget (state, selectedTarget) {
  return { ...state,
    selectedTarget: selectedTarget
  }
}

function setStatus (state, status) {
  return { ...state,
    status: status
  }
}

function setClickMapToAddTarget (state, clickMapToAddTarget) {
  return { ...state,
    clickMapToAddTarget: clickMapToAddTarget
  }
}

function rfpReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RFP_CLEAR_STATE:
      return clearState(state)

    case Actions.RFP_SHOW_HIDE_STATUS_MODAL:
      return setRfpStatusModalVisibility(state, action.payload)

    case Actions.RFP_ADD_TARGETS:
      return addTargets(state, action.payload)

    case Actions.RFP_REMOVE_TARGET:
      return removeTarget(state, action.payload)

    case Actions.RFP_REPLACE_TARGET:
      return replaceTarget(state, action.payload.index, action.payload.target)

    case Actions.RFP_SET_SELECTED_TARGET:
      return setSelectedTarget(state, action.payload)

    case Actions.RFP_SET_STATUS:
      return setStatus(state, action.payload)

    case Actions.RFP_SET_CLICK_MAP_TO_ADD_TARGET:
      return setClickMapToAddTarget(state, action.payload)

    default:
      return state
  }
}

export default rfpReducer
