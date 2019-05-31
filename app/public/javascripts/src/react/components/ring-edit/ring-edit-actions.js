/* globals */
import Actions from '../../common/actions'

function setTestState (testState) {
  return {
    type: Actions.RING_SET_TEST_STATE, 
    payload: testState
  }
}

function setSelectedRingId (ringId) {
  return {
    type: Actions.RING_SET_SELECTED_RING_ID, 
    payload: ringId
  }
}

function addRings (rings) {
  return {
    type: Actions.RING_ADD_RINGS, 
    payload: rings
  }
}

function removeRing (ringId) {
  return {
    type: Actions.RING_REMOVE_RING, 
    payload: ringId
  }
}

export default {
  setTestState, 
  setSelectedRingId, 
  addRings, 
  removeRing
}
