import Actions from '../../common/actions'

const defaultState = {
  testState: 'init'
}

function setTestState (state, testState) {
  console.log('test state: ', testState)
  return { ...state, 
    testState
  }
}

function ringEditReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RING_SET_TEST_STATE:
      return setTestState(state, action.payload)
    
    default:
      return state
  }
}

export default ringEditReducer