/* globals */
import Actions from '../../common/actions'

function setTestState (testState) {
  return {
    type: Actions.RING_SET_TEST_STATE, 
    payload: testState
  }
}

export default {
  setTestState: setTestState
}
