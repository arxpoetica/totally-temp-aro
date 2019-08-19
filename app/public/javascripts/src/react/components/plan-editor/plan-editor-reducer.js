import Actions from '../../common/actions'

const defaultState = {
  isPlanEditorActive: false,
  transaction: null,
  features: {
    equipments: {},
    boundaries: {}
  },
  isCalculatingSubnets: false,
  isCreatingObject: false,
  isModifyingObject: false
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

function addTransactionEquipment (state, equipments) {
  var newEquipments = { ...state.features.equipments }
  equipments.forEach(equipment => { newEquipments[equipment.feature.objectId] = equipment })
  return { ...state,
    features: { ...state.features,
      equipments: newEquipments
    }
  }
}

function removeTransactionEquipment (state, objectId) {
  var newEquipments = { ...state.features.equipments }
  delete newEquipments[objectId]
  return { ...state,
    features: { ...state.features,
      equipments: newEquipments
    }
  }
}

function addTransactionEquipmentBoundary (state, equipmentBoundaries) {
  var newEquipmentBoundaries = { ...state.features.boundaries }
  equipmentBoundaries.forEach(boundary => { newEquipmentBoundaries[boundary.feature.objectId] = boundary })
  return { ...state,
    features: { ...state.features,
      boundaries: newEquipmentBoundaries
    }
  }
}

function removeTransactionEquipmentBoundary (state, objectId) {
  var newEquipmentBoundaries = { ...state.features.boundaries }
  delete newEquipmentBoundaries[objectId]
  return { ...state,
    features: { ...state.features,
      boundaries: newEquipmentBoundaries
    }
  }
}

function setIsCalculatingSubnets (state, isCalculatingSubnets) {
  return { ...state,
    isCalculatingSubnets: isCalculatingSubnets
  }
}

function setIsCreatingObject (state, isCreatingObject) {
  return { ...state,
    isCreatingObject: isCreatingObject
  }
}

function setIsModifyingObject (state, isModifyingObject) {
  return { ...state,
    isModifyingObject: isModifyingObject
  }
}

function planEditorReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.PLAN_EDITOR_CLEAR_TRANSACTION:
      return clearTransaction()

    case Actions.PLAN_EDITOR_SET_TRANSACTION:
      return setTransaction(state, action.payload)

    case Actions.PLAN_EDITOR_ADD_EQUIPMENT_NODES:
      return addTransactionEquipment(state, action.payload)

    case Actions.PLAN_EDITOR_REMOVE_EQUIPMENT_NODE:
      return removeTransactionEquipment(state, action.payload)

    case Actions.PLAN_EDITOR_ADD_EQUIPMENT_BOUNDARY:
      return addTransactionEquipmentBoundary(state, action.payload)

    case Actions.PLAN_EDITOR_REMOVE_EQUIPMENT_BOUNDARY:
      return removeTransactionEquipmentBoundary(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS:
      return setIsCalculatingSubnets(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_CREATING_OBJECT:
      return setIsCreatingObject(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_MODIFYING_OBJECT:
      return setIsModifyingObject(state, action.payload)

    default:
      return state
  }
}

export default planEditorReducer
