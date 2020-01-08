import Actions from '../../../common/actions'
import DefaultOptimizationInputs from '../../common/optimization-options/default-optimization-inputs'

const defaultState = {
  optimizationInputs: DefaultOptimizationInputs // serialization helper
}

function setOptimizationInputs (state, inputs) {
  var newState = { ...state,
    optimizationInputs: { ...state.optimizationInputs, ...inputs }
  }
  return newState
}

function optimizationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS:
      return setOptimizationInputs(state, action.payload)

    default:
      return state
  }
}

export default optimizationReducer
