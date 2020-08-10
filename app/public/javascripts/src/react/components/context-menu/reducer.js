import Actions from '../../common/actions'

const defaultState = {
  isVisible: false,
  coordinateX: 0,
  coordinateY: 0,
  menuItemFeatures: []
}

function showContextMenu (state, isVisible, x, y) {
  return { ...state,
    isVisible: isVisible,
    coordinateX: x,
    coordinateY: y
  }
}

function hideContextMenu (state) {
  return { ...state,
    isVisible: false,
    coordinateX: 0,
    coordinateY: 0
  }
}

function setMenuItems (state, menuItemFeatures) {
  return { ...state,
    menuItemFeatures: menuItemFeatures
  }
}

function contextMenuReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.CONTEXT_MENU_SHOW:
      return showContextMenu(state, action.payload.isVisible, action.payload.x, action.payload.y)

    case Actions.CONTEXT_MENU_HIDE:
      return hideContextMenu(state)

    case Actions.CONTEXT_MENU_SET_ITEMS:
      return setMenuItems(state, action.payload)

    default:
      return state
  }
}

export default contextMenuReducer
