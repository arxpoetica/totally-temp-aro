import Actions from '../../common/actions'

const defaultState = {
  isPlanEditorActive: false,
  transaction: null,
  features: {},
  selectedEditFeatureIds: [],
  isDrawingBoundaryFor: null,
  isCalculatingSubnets: false,
  isCalculatingBoundary: false,
  isCreatingObject: false,
  isModifyingObject: false,
  isDraggingFeatureForDrop: false,
  isEditingFeatureProperties: false,
  isEnteringTransaction: false,
  isCommittingTransaction: false,
  requestedSubnetIds: [],
  subnets: {},
  subnetFeatures: {},
  selectedSubnetId: '', // need to rename this now that a terminal can be selected, lets do "activeFeature" // unselected this should be null not ''
  boundaryDebounceBySubnetId: {},
  fiberRenderRequired: true,
  cursorLocationIds: [],
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

function addTransactionFeatures (state, equipments) {
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
      // not really sure why this check is needed
      //  I think we can combine the add and modify actions 
      throw new Error(`Trying to modify equipment with objectId ${equipment.feature.objectId}, but it is not in the existing list of equipments`)
    }
  })
  return { ...state,
    features: newFeatures
  }
}

function clearTransactionFeatures (state) {
  return { ...state, features: {}, selectedEditFeatureIds: [] }
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

function setIsCalculatingBoundary (state, isCalculatingBoundary) {
  return { ...state,
    isCalculatingBoundary: isCalculatingBoundary
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

function setSelectedEditFeatureIds (state, selectedEditFeatureIds) {
  return { ...state,
    selectedEditFeatureIds: selectedEditFeatureIds
  }
}

function deselectFeature (state, objectId) {
  let newSelectedFeatureIds = [...state.selectedEditFeatureIds]
  let i = newSelectedFeatureIds.indexOf(objectId)
  if (i < 0) return state
  newSelectedFeatureIds.splice(i, 1)
  return { ...state,
    selectedEditFeatureIds: newSelectedFeatureIds
  }
}

function addRequestedSubnetIds (state, subnetIds) {
  let updatedRequestedSubnetIds = [ ...new Set(state.requestedSubnetIds.concat(subnetIds))]
  return { ...state,
    requestedSubnetIds: updatedRequestedSubnetIds,
  }
}

function removeRequestedSubnetIds (state, subnetIds) {
  let updatedRequestedSubnetIds = state.requestedSubnetIds.filter(subnetId => !subnetIds.includes(subnetId))
  return { ...state,
    requestedSubnetIds: updatedRequestedSubnetIds,
  }
}

function addSubnets (state, newSubnets) {
  return { ...state, subnets: { ...state.subnets, ...newSubnets } }
}

function updateSubnetBoundary (state, subnetId, geometry) {
  if (!state.subnets[subnetId]) return state
  
  return {
    ...state, 
    subnets: {
      ...state.subnets, 
      [subnetId]: {
        ...state.subnets[subnetId],
        subnetBoundary: {
          ...state.subnets[subnetId].subnetBoundary,
          polygon: geometry,
        }
      }
    }
  }
}

function setSubnetFeatures (state, subnetFeatures) {
  return { ...state, subnetFeatures: subnetFeatures || {} }
}

function updateSubnetFeatures (state, updatedSubnetFeatures) {
  return { ...state, subnetFeatures: { ...state.subnetFeatures, ...updatedSubnetFeatures } }
}

function removeSubnetFeature (state, featureId) {

  const subnetId = state.subnetFeatures[featureId].subnetId
  let updatedSubnets = JSON.parse(JSON.stringify(state.subnets))
  const updatedSubnetFeatures = { ...state.subnetFeatures }
 
  // this checks if the ID is a subnet, not sure if this should happen here or in actions
  // TODO: I feel like there is a better way to check this
  if (state.subnetFeatures[featureId].feature.networkNodeType === "central_office" ||
  state.subnetFeatures[featureId].feature.networkNodeType === "fiber_distribution_hub") {
    // removes each of the children from subnet features
    updatedSubnets[featureId].children.forEach(child => {
      delete updatedSubnetFeatures[child]
    })
    // removes from subnets and subnet features
    delete updatedSubnets[featureId]
    delete updatedSubnetFeatures[featureId]
  } else {
    // if it is not a parent itself then it just removes from subFeatures and from its parent in subnets
    delete updatedSubnetFeatures[featureId]
    updatedSubnets[subnetId].children = updatedSubnets[subnetId].children.filter(childId => childId !== featureId)
  }
  return { ...state, subnetFeatures: updatedSubnetFeatures, subnets: updatedSubnets }
}

function removeSubnets (state, subnets) {
  const updatedSubnets = { ...state.subnets }
  for (const subnet of subnets) {
    delete updatedSubnets[subnet.subnetId.id]
    // ToDo: remove children from subnetFeatures
  }
  return { ...state, subnets: updatedSubnets }
}

function clearSubnets (state) {
  return { ...state, subnets: {}, selectedSubnetId: '', subnetFeatures: {} }
}

function setSelectedSubnetId (state, selectedSubnetId) {
  return { ...state, selectedSubnetId }
}

function setBoundaryDebounce (state, subnetId, timeoutId) {
  return {
    ...state, 
    boundaryDebounceBySubnetId: {
      ...state.boundaryDebounceBySubnetId, 
      [subnetId]: timeoutId,
    }
  }
}

function clearBoundaryDebounce (state, subnetId) {
  let newBoundaryDebounceBySubnetId = JSON.parse(JSON.stringify(state.boundaryDebounceBySubnetId))
  delete newBoundaryDebounceBySubnetId[subnetId]
  return {
    ...state, 
    boundaryDebounceBySubnetId: newBoundaryDebounceBySubnetId
  }
}

function planEditorReducer (state = defaultState, { type, payload }) {
  switch (type) {
    case Actions.PLAN_EDITOR_CLEAR_TRANSACTION:
      return clearTransaction()

    case Actions.PLAN_EDITOR_SET_TRANSACTION:
      return setTransaction(state, payload)

    case Actions.PLAN_EDITOR_ADD_FEATURES:
      return addTransactionFeatures(state, payload)

    case Actions.PLAN_EDITOR_DELETE_TRANSACTION_FEATURE:
      return deleteTransactionFeature(state, payload)

    case Actions.PLAN_EDITOR_MODIFY_FEATURES:
      return modifyTransactionFeatures(state, payload)

    case Actions.PLAN_EDITOR_CLEAR_FEATURES:
      return clearTransactionFeatures(state)

    case Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS:
      return setIsCalculatingSubnets(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_CALCULATING_BOUNDARY:
      return setIsCalculatingBoundary(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_CREATING_OBJECT:
      return setIsCreatingObject(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_MODIFYING_OBJECT:
      return setIsModifyingObject(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP:
      return setIsDraggingFeatureForDrop(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR:
      return setIsDrawingBoundaryFor(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES:
      return setIsEditingFeatureProperties(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION:
      return setIsCommittingTransaction(state, payload)

    case Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION:
      return setIsEnteringTransaction(state, payload)

    case Actions.PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS:
      return setSelectedEditFeatureIds(state, payload)

    case Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE:
      return deselectFeature(state, payload)

    case Actions.PLAN_EDITOR_ADD_REQUESTED_SUBNET_IDS:
      return addRequestedSubnetIds(state, payload)

    case Actions.PLAN_EDITOR_REMOVE_REQUESTED_SUBNET_IDS:
      return removeRequestedSubnetIds(state, payload)

    case Actions.PLAN_EDITOR_ADD_SUBNETS:
      return addSubnets(state, payload)

    case Actions.PLAN_EDITOR_UPDATE_SUBNET_BOUNDARY:
      return updateSubnetBoundary(state, payload.subnetId, payload.geometry)

    case Actions.PLAN_EDITOR_SET_SUBNET_FEATURES:
      return setSubnetFeatures(state, payload)

    case Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES:
      return updateSubnetFeatures(state, payload)

    case Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE:
      return removeSubnetFeature(state, payload)

    case Actions.PLAN_EDITOR_REMOVE_SUBNETS:
      return removeSubnets(state, payload)

    case Actions.PLAN_EDITOR_CLEAR_SUBNETS:
      return clearSubnets(state)

    case Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID:
      return setSelectedSubnetId(state, payload)

    case Actions.PLAN_EDITOR_SET_BOUNDARY_DEBOUNCE:
      return setBoundaryDebounce(state, payload.subnetId, payload.timeoutId)

    case Actions.PLAN_EDITOR_CLEAR_BOUNDARY_DEBOUNCE:
      return clearBoundaryDebounce(state, payload)
    
    case Actions.PLAN_EDITOR_SET_FIBER_RENDER_REQUIRED:
      return { ...state, fiberRenderRequired: payload }
      
    case Actions.PLAN_EDITOR_SET_CURSOR_LOCATION_IDS:
      return { ...state, cursorLocationIds: payload }

    case Actions.PLAN_EDITOR_CLEAR_CURSOR_LOCATION_IDS:
      return { ...state, cursorLocationIds: [] }

    default:
      return state
  }
}

export default planEditorReducer
