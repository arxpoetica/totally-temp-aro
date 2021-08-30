import Actions from '../../common/actions'

const defaultState = {
  isPlanEditorActive: false,
  transaction: null,
  features: {},
  isDrawingBoundaryFor: null,
  isCalculatingSubnets: false,
  isCreatingObject: false,
  isModifyingObject: false,
  isDraggingFeatureForDrop: false,
  isEditingFeatureProperties: false,
  isEnteringTransaction: false,
  isCommittingTransaction: false,
  isPlanEditorChanged: false,
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

function addTransactionFeature (state, equipments) {
  var newFeatures = { ...state.features }
  equipments.forEach(equipment => {
    newFeatures[equipment.feature.objectId] = equipment
  })
  return { ...state,
    features: newFeatures
  }
}

function deleteTransactionFeature (state, objectId) {
  var newFeature = { ...state.features[objectId] }
  newFeature.crudAction = 'delete'
  return { ...state,
    features: { ...state.features,
      [objectId]: newFeature
    }
  }
}

function modifyTransactionFeatures (state, newEquipments) {
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

function setIsEditingFeatureProperties (state, isEditingFeatureProperties) {
  return { ...state,
    isEditingFeatureProperties: isEditingFeatureProperties
  }
}

function setIsCommittingTransaction (state, isCommittingTransaction) {
  return { ...state,
    isCommittingTransaction: isCommittingTransaction
  }
}

function setIsEnteringTransaction (state, isEnteringTransaction) {
  return { ...state,
    isEnteringTransaction: isEnteringTransaction
  }
}

function setIsPlanEditorChanged (state, isPlanEditorChanged) {
  return { ...state,
    isPlanEditorChanged: isPlanEditorChanged
  }
}

function planEditorReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.PLAN_EDITOR_CLEAR_TRANSACTION:
      return clearTransaction()

    case Actions.PLAN_EDITOR_SET_TRANSACTION:
      return setTransaction(state, action.payload)

    case Actions.PLAN_EDITOR_ADD_FEATURES:
      return addTransactionFeature(state, action.payload)

    case Actions.PLAN_EDITOR_DELETE_TRANSACTION_FEATURE:
      return deleteTransactionFeature(state, action.payload)

    case Actions.PLAN_EDITOR_MODIFY_FEATURES:
      return modifyTransactionFeatures(state, action.payload)

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

    case Actions.PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES:
      return setIsEditingFeatureProperties(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION:
      return setIsCommittingTransaction(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION:
      return setIsEnteringTransaction(state, action.payload)

    case Actions.PLAN_EDITOR_SET_IS_PLAN_EDITOR_CHANGED:
      return setIsPlanEditorChanged(state, action.payload)

    default:
      return state
  }
}

export default planEditorReducer
