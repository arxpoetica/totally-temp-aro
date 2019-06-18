/* globals */
import Actions from '../../common/actions'

function showOrHideFullScreenContainer (showFullScreenContainer) {
  return {
    type: Actions.FULL_SCREEN_SHOW_CONTAINER,
    payload: showFullScreenContainer
  }
}

export default {
  showOrHideFullScreenContainer
}
