import Actions from '../../../common/actions'
import DefaultOptimizationInputs from './default-optimization-inputs'
import ObjectUtils from '../../../../shared-utils/object-utils'

const defaultState = {
  optimizationInputs: DefaultOptimizationInputs, // serialization helper
  isCanceling: false,
  optimizationId: null
}

function setOptimizationInputs (state, inputs) {
  var newState = { ...state,
    optimizationInputs: { ...state.optimizationInputs, ...inputs }
  }
  console.log('mask test')
  console.log(inputs)
  console.log(state.optimizationInputs)
  console.log(ObjectUtils.maskedMerge(state.optimizationInputs, inputs))
  console.log(' --- ')
  return newState
}

function setIsCanceling (state, isCanceling) {
  var newState = { ...state,
    isCanceling: isCanceling
  }
  return newState
}

function setOptimizationId (state, optimizationId) {
  var newState = { ...state,
    optimizationId: optimizationId
  }
  return newState
}

function clearOptimizationId (state) {
  return setOptimizationId(state, null)
}

function optimizationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS:
      return setOptimizationInputs(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_IS_CANCELING:
      return setIsCanceling(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID:
      return setOptimizationId(state, action.payload)
    case Actions.NETWORK_OPTIMIZATION_CLEAR_OPTIMIZATION_ID:
      return clearOptimizationId(state)
    default:
      return state
  }
}

export default optimizationReducer
