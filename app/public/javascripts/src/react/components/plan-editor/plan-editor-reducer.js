import Actions from '../../common/actions'

const defaultState = {
  isPlanEditorActive: false,
  transaction: null,
  features: {},
  isDrawingBoundaryFor: null,
  isCalculatingSubnets: false,
  isCreatingObject: false,
  isModifyingObject: false,
  isDraggingFeatureForDrop: false
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
  var newFeatures = { ...state.features }
  equipments.forEach(equipment => {
    newFeatures[equipment.feature.objectId] = equipment
  })
  return { ...state,
    features: newFeatures
  }
}

function removeTransactionEquipment (state, objectId) {
  var newFeatures = { ...state.features }
  delete newFeatures[objectId]
  return { ...state,
    features: newFeatures
  }
}

function addTransactionEquipmentBoundary (state, equipmentBoundaries) {
  var newFeatures = { ...state.features }
  equipmentBoundaries.forEach(boundary => {
    newFeatures[boundary.feature.objectId] = boundary
  })
  return { ...state,
    features: newFeatures
  }
}

function removeTransactionEquipmentBoundary (state, objectId) {
  var newFeatures = { ...state.features }
  delete newFeatures[objectId]
  return { ...state,
    features: newFeatures
  }
}

function modifyTransactionEquipments (state, newEquipments) {
  var newFeatures = { ...state.features }
  newEquipments.forEach(equipment => {
    if (newFeatures[equipment.feature.objectId]) {
      newFeatures[equipment.feature.objectId] = equipment
    } else {
      throw new Error(`Trying to modify equipment with objectId ${equipment.feature.objectId}, but it is not in the existing list of equipments`)
    }
  })
  return { ...state,
    features: newFeatures
  }
}

function setIsDrawingBoundaryFor (state, isDrawingBoundaryFor) {
  return { ...state,
    isDrawingBoundaryFor: isDrawingBoundaryFor
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

function setIsDraggingFeatureForDrop (state, isDraggingFeatureForDrop) {
  return { ...state,
    isDraggingFeatureForDrop: isDraggingFeatureForDrop
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

    case Actions.PLAN_EDITOR_MODIFY_EQUIPMENT_NODES:
      return modifyTransactionEquipments(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS:
      return setIsCalculatingSubnets(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_CREATING_OBJECT:
      return setIsCreatingObject(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_MODIFYING_OBJECT:
      return setIsModifyingObject(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP:
      return setIsDraggingFeatureForDrop(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR:
      return setIsDrawingBoundaryFor(state, action.payload)

    default:
      return state
  }
}

export default planEditorReducer
