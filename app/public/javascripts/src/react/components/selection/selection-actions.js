import Actions from '../../common/actions'

function setActiveSelectionMode (selectionModeId) {
  return {
    type: Actions.SELECTION_SET_ACTIVE_MODE,
    payload: selectionModeId
  }
}

export default {
  setActiveSelectionMode: setActiveSelectionMode
}
