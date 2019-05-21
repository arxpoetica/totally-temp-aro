import Actions from '../../../common/actions'

const defaultState = {
  options: {
    hle_id: {
      displayName: 'HLE ID',
      value: 100
    },
    system_config: {
      displayName: 'System config',
      value: 'sales_1'
    },
    service_layer_strategy: {
      displayName: 'Service layer strategy',
      value: 'dynamic'
    },
    routing_type: {
      displayName: 'Routing type',
      value: 'point_to_point'
    },
    fiber_routing_mode: {
      displayName: 'Fiber routing mode',
      value: 'route_from_fiber'
    },
    max_distance_to_splice_point_meters: {
      displayName: 'Max distance to splice point',
      value: 15000
    },
    near_net_distance_meters: {
      displayName: 'Near-net distance',
      value: 500
    },
    near_net_strategy: {
      displayName: 'Near-net strategy',
      value: 'euclidean'
    }
  },
  targets: [],
  showRfpStatusModal: false
}

function initialize () {
  return JSON.parse(JSON.stringify(defaultState))
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

function rfpReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RFP_INITIALIZE:
      return initialize(state)

    case Actions.RFP_CLEAR_STATE:
      return clearState(state)

    case Actions.RFP_SHOW_HIDE_STATUS_MODAL:
      return setRfpStatusModalVisibility(state, action.payload)

    case Actions.RFP_ADD_TARGETS:
      return addTargets(state, action.payload)

    case Actions.RFP_REMOVE_TARGET:
      return removeTarget(state, action.payload)

    default:
      return state
  }
}

export default rfpReducer
