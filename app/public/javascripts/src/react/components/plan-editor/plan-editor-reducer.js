import Actions from '../../common/actions'

const defaultState = {
  isPlanEditorActive: false,
  transaction: null,
  features: {
    equipmentNodes: [],
    boundaries: []
  }
}

function setTransaction (state, transaction) {
  return { ...state,
    isPlanEditorActive: true,
    transaction: transaction
  }
}

function clearTransaction () {
  return JSON.parse(JSON.stringify(defaultState))
}

function addEquipmentNodes (state, equipmentNodes) {
  return { ...state,
    features: { ...state.features,
      equipmentNodes: state.features.equipmentNodes.concat(equipmentNodes)
    }
  }
}

function removeEquipmentNode (state, objectId) {
  const indexToRemove = state.features.equipmentNodes.findIndex(equipmentNode => equipmentNode.objectId === objectId)
  var newEquipmentNodes = [].concat(state.features.equipmentNodes)
  newEquipmentNodes.splice(indexToRemove, 1)
  return { ...state,
    features: { ...state.features,
      equipmentNodes: newEquipmentNodes
    }
  }
}

function planEditorReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.PLAN_EDITOR_CLEAR_TRANSACTION:
      return clearTransaction()

    case Actions.PLAN_EDITOR_SET_TRANSACTION:
      return setTransaction(state, action.payload)

    case Actions.PLAN_EDITOR_ADD_EQUIPMENT_NODES:
      return addEquipmentNodes(state, action.payload)

    case Actions.PLAN_EDITOR_REMOVE_EQUIPMENT_NODE:
      return removeEquipmentNode(state, action.payload)

    default:
      return state
  }
}

export default planEditorReducer
