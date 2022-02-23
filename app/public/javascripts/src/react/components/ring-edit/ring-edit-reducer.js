import Actions from '../../common/actions'
// import AroNetworkConstraints from '../../../shared-utils/aro-network-constraints'
// import ConnectivityDefinition from '../common/optimization-options/connectivity-definition'
import RingStatusTypes from './constants'

const defaultState = {
  rings: {},
  selectedRingId: null,
  analysis: {
    status: RingStatusTypes.START_STATE,
    progress: 0,
    report: null
  },
  isEditingRing: false,
}

function setAnalysisStatus (state, status) {
  return { ...state,
    analysis: { ...state.analysis, status: status }
  }
}

function setAnalysisProgress (state, progress) {
  return { ...state,
    analysis: { ...state.analysis, progress: progress }
  }
}

function setAnalysisReport (state, report) {
  return { ...state,
    analysis: { ...state.analysis, report: report }
  }
}

function setSelectedRingId (state, ringId) {
  return { ...state,
    selectedRingId: ringId
  }
}

function addRings (state, rings) {
  var newRings = {}
  rings.forEach(ring => {
    newRings[ring.id] = ring
  })
  return { ...state,
    rings: { ...state.rings, ...newRings }
  }
}

function removeRing (state, ringId) {
  var newRings = { ...state.rings }
  delete newRings[ringId]
  return { ...state,
    rings: newRings
  }
}

function removeAllRings (state) {
  return { ...state,
    rings: {},
    selectedRingId: null
  }
}

function updateRing (state, ring) {
  if (!state.rings.hasOwnProperty(ring.id)) return state

  var newRings = {}
  newRings[ring.id] = ring

  return { ...state,
    rings: { ...state.rings, ...newRings }
  }
}

function setIsEditingRing (state, isEditingRing) {
  return { ...state,
    isEditingRing,
  }
}

function ringEditReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RING_SET_ANALYSIS_STATUS:
      return setAnalysisStatus(state, action.payload)

    case Actions.RING_SET_ANALYSIS_PROGRESS:
      return setAnalysisProgress(state, action.payload)

    case Actions.RING_SET_ANALYSIS_REPORT:
      return setAnalysisReport(state, action.payload)

    case Actions.RING_SET_SELECTED_RING_ID:
      return setSelectedRingId(state, action.payload)

    case Actions.RING_ADD_RINGS:
      return addRings(state, action.payload)

    case Actions.RING_REMOVE_RING:
      return removeRing(state, action.payload)

    case Actions.RING_REMOVE_ALL_RINGS:
      return removeAllRings(state)

    case Actions.RING_UPDATE_RING:
      return updateRing(state, action.payload)

    case Actions.RING_SET_IS_EDITING:
      return setIsEditingRing(state, action.payload)

    default:
      return state
  }
}

export default ringEditReducer
