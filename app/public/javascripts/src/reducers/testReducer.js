function counter(state, action) {

  console.log(state)
  console.log(typeof state)

  if (typeof state === 'undefined') {
    console.log('setting state')
    state = { value: 0, test: 'asdf' } // If state is undefined, initialize it with a default value
  }
  console.log(state)

  if (action.type === 'INCREMENT') {
    return Object.assign({}, state, { value: state.value + 1 })
  } else if (action.type === 'DECREMENT') {
    return Object.assign({}, state, { value: state.value - 1 })
  } else {
    return state // In case an action is passed in we don't understand
  }
}

export default counter