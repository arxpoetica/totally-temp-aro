import Actions from '../../common/actions'

const defaultState = {
  testState: 'init', 
  rings: {}, 
  selectedRingId: null
}

function setTestState (state, testState) {
  console.log('test state: ', testState)
  console.log(state)
  return { ...state, 
    testState
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
    rings: {...state.rings, ...newRings}
  }
}

function removeRing (state, ringId) {
  var newRings = {...state.rings}
  delete newRings[ringId]
  return { ...state,
    rings: newRings
  }
}

function ringEditReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RING_SET_TEST_STATE:
      return setTestState(state, action.payload)
    case Actions.RING_SET_SELECTED_RING_ID:
      return setSelectedRingId(state, action.payload)
    case Actions.RING_ADD_RINGS:
      return addRings(state, action.payload)
    case Actions.RING_REMOVE_RING:
      return removeRing(state, action.payload)
    
    default:
      return state
  }
}

export default ringEditReducer