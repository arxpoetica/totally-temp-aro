function counter(state, action) {
  if (typeof state === 'undefined') {
    state = { value: 0, test: 'asdf' } // If state is undefined, initialize it with a default value
  }

  if (action.type === 'INCREMENT') {
    return Object.assign({}, state, { value: state.value + 1 })
  } else if (action.type === 'DECREMENT') {
    return Object.assign({}, state, { value: state.value - 1 })
  } else {
    return state // In case an action is passed in we don't understand
  }
}

export default counter