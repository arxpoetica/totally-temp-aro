/* globals */
import Actions from '../../../common/actions'

function initialize () {
  return {
    type: Actions.RFP_INITIALIZE
  }
}

function clearState () {
  return {
    type: Actions.RFP_CLEAR_STATE
  }
}

export default {
  initialize: initialize,
  clearState: clearState
}
