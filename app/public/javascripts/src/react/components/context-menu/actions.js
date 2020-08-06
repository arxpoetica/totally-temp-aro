import Actions from '../../common/actions'

function showContextMenu (x, y) {
  return {
    type: Actions.CONTEXT_MENU_SHOW,
    payload: {
      isVisible: true,
      x: x,
      y: y
    }
  }
}

function hideContextMenu () {
  return {
    type: Actions.CONTEXT_MENU_HIDE
  }
}

function setContextMenuItems (menuItemFeatures) {
  return {
    type: Actions.CONTEXT_MENU_SET_ITEMS,
    payload: menuItemFeatures
  }
}

export default {
  showContextMenu,
  hideContextMenu,
  setContextMenuItems
}
