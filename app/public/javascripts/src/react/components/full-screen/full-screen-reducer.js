import Actions from '../../common/actions'

function setShowFullScreenContainer (state, showFullScreenContainer) {
  return { ...state,
    showFullScreenContainer: showFullScreenContainer
  }
}

function fullScreenReducer (state = { showFullScreenContainer: false }, action) {
  switch (action.type) {
    case Actions.FULL_SCREEN_SHOW_HIDE_CONTAINER:
      return setShowFullScreenContainer(state, action.payload)

    default:
      return state
  }
}

export default fullScreenReducer
