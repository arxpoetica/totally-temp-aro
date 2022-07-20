import { klona } from 'klona'
import Actions from '../../common/actions'

const defaultState = {
  isPlanEditorActive: false,
  transaction: null,
  // TODO: move this elsewhere?
  socketUnsubscriber: () => {}, // default is no op
  features: {},
  selectedEditFeatureIds: [],
  isDrawingBoundaryFor: null,
  isRecalculating: false,
  isCalculatingSubnets: false,
  isCalculatingBoundary: false,
  isCreatingObject: false,
  isModifyingObject: false,
  isDraggingFeatureForDrop: false,
  isEditingFeatureProperties: false,
  isEnteringTransaction: false,
  isCommittingTransaction: false,
  draftsState: null,
  draftProgressTuple: [0, 1], // -> [count loaded, total count to load]
  drafts: {},
  subnets: {},
  subnetFeatures: {},
  selectedSubnetId: null, // need to rename this now that a terminal can be selected, lets do "activeFeature" // unselected this should be null not ''
  boundaryDebounceBySubnetId: {},
  cursorLocationIds: [],
  cursorEquipmentIds: [],
  selectedFiber: [],
  fiberAnnotations: {},
  clickedLatLng: [],
  planThumbInformation: {},
}

function setTransaction (state, transaction) {
  return { ...state,
    isPlanEditorActive: true,
    transaction: transaction
  }
}

function clearTransaction () {
  return klona(defaultState)
}

function addTransactionFeatures (state, transactionFeatures) {
  var newFeatures = { ...state.features }
  transactionFeatures.forEach(transFeature => {
    newFeatures[transFeature.feature.objectId] = transFeature
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

function modifyTransactionFeatures (state, newTransactionFeatures) {
  var newFeatures = { ...state.features }
  newTransactionFeatures.forEach(transFeature => {
    if (newFeatures[transFeature.feature.objectId]) {
      newFeatures[transFeature.feature.objectId] = transFeature
    } else {
      // not really sure why this check is needed
      //  I think we can combine the add and modify actions 
      throw new Error(`Trying to modify equipment with objectId ${transFeature.feature.objectId}, but it is not in the existing list of transaction features`)
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
  return { ...state, isDrawingBoundaryFor }
}

function setIsRecalculating (state, isRecalculating) {
  return { ...state, isRecalculating }
}

function setIsCalculatingSubnets (state, isCalculatingSubnets) {
  return { ...state, isCalculatingSubnets }
}

function setIsCalculatingBoundary (state, isCalculatingBoundary) {
  return { ...state, isCalculatingBoundary }
}

function setIsCreatingObject (state, isCreatingObject) {
  return { ...state, isCreatingObject }
}

function setIsModifyingObject (state, isModifyingObject) {
  return { ...state, isModifyingObject }
}

function setIsDraggingFeatureForDrop (state, isDraggingFeatureForDrop) {
  return { ...state, isDraggingFeatureForDrop }
}

function setPlanThumbInformation (state, planThumbInformation) {
  return { ...state, planThumbInformation }
}

function updatePlanThumbInformation (state, payload) {
  const planThumbInformationClone = klona(state.planThumbInformation)
  planThumbInformationClone[payload.key] = payload.planThumbInformation;
  return { ...state, planThumbInformation: planThumbInformationClone }
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
/*
function deselectFeature (state, objectId) {
  let newSelectedFeatureIds = [...state.selectedEditFeatureIds]
  let i = newSelectedFeatureIds.indexOf(objectId)
  if (i < 0) return state
  newSelectedFeatureIds.splice(i, 1)
  return { ...state,
    selectedEditFeatureIds: newSelectedFeatureIds
  }
}
*/
function deselectFeature (state, objectId) {
  return deselectFeatures(state, [objectId])
}

function deselectFeatures (state, objectIds) {
  // could be optomised by iterating through objectIds instead of selectedEditFeatureIds
  let newSelectedFeatureIds = state.selectedEditFeatureIds.filter(seletedId => {
    return !objectIds.includes(seletedId)
  })
  return { ...state,
    selectedEditFeatureIds: newSelectedFeatureIds
  }
}

// will merge props into draft entries
function mergeDraftProps(state, draftProps) {
  const mergedDrafts = {}
  Object.keys(draftProps).forEach(id => {
    mergedDrafts[id] = { ...(state.drafts[id] || {}), ...draftProps[id] }
  })
  return { ...state, drafts: { ...state.drafts, ...mergedDrafts } }
}

function setDraftLocations(state, subnetId, locations) {
  return {
    ...state, 
    drafts: {
      ...state.drafts, 
      [subnetId]: {
        ...state.drafts[subnetId],
        locations: locations,
      }
    }
  } 
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

function removeSubnetFeatures (state, featureIds) {

  let updatedSubnets = klona(state.subnets)
  const updatedSubnetFeatures = klona(state.subnetFeatures)

  featureIds.forEach(featureId => {
    // this checks if the ID is a subnet, not sure if this should happen here or in actions
    // TODO: I feel like there is a better way to check this
    if (
      state.subnetFeatures[featureId].feature.networkNodeType === 'central_office'
      || state.subnetFeatures[featureId].feature.networkNodeType === 'fiber_distribution_hub'
    ) {
      // removes from subnets and subnet features
      delete updatedSubnets[featureId]
      delete updatedSubnetFeatures[featureId]
    } else {
      // if it is not a parent itself then it just removes from subFeatures and from its parent in subnets
      const subnetId = updatedSubnetFeatures[featureId].subnetId
      delete updatedSubnetFeatures[featureId]
      if (subnetId) {
        updatedSubnets[subnetId].children = updatedSubnets[subnetId].children || []
        updatedSubnets[subnetId].children = updatedSubnets[subnetId].children.filter(childId => childId !== featureId)
      }
    }
  })
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
  let newBoundaryDebounceBySubnetId = klona(state.boundaryDebounceBySubnetId)
  delete newBoundaryDebounceBySubnetId[subnetId]
  return {
    ...state, 
    boundaryDebounceBySubnetId: newBoundaryDebounceBySubnetId
  }
}

function removeFromDraft (state, payload) {
  if (!state.drafts[payload]) return state
  const updatedDrafts = { ...state.drafts }
  delete updatedDrafts[payload]
  return { ...state, drafts: updatedDrafts }
}

// --- //
function planEditorReducer (state = defaultState, { type, payload }) {
  switch (type) {
    case Actions.PLAN_EDITOR_CLEAR_TRANSACTION:
      return clearTransaction()

    case Actions.PLAN_EDITOR_SET_TRANSACTION:
      return setTransaction(state, payload)

    case Actions.PLAN_EDITOR_SET_SOCKET_UNSUBSCRIBER:
      return { ...state, socketUnsubscriber: payload }

    case Actions.PLAN_EDITOR_CLEAR_SOCKET_UNSUBSCRIBER:
      return { ...state, socketUnsubscriber: () => {} }

    case Actions.PLAN_EDITOR_ADD_FEATURES:
      return addTransactionFeatures(state, payload)

    case Actions.PLAN_EDITOR_DELETE_TRANSACTION_FEATURE:
      return deleteTransactionFeature(state, payload)

    case Actions.PLAN_EDITOR_MODIFY_FEATURES:
      return modifyTransactionFeatures(state, payload)

    case Actions.PLAN_EDITOR_CLEAR_FEATURES:
      return clearTransactionFeatures(state)

    case Actions.PLAN_EDITOR_SET_IS_RECALCULATING:
      return setIsRecalculating(state, payload)

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

    case Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURES:
      return deselectFeatures(state, payload)

    case Actions.PLAN_EDITOR_SET_DRAFTS_STATE:
      return { ...state, draftsState: payload }

    case Actions.PLAN_EDITOR_SET_DRAFTS_PROGRESS_TUPLE:
      return { ...state, draftProgressTuple: payload }

    case Actions.PLAN_EDITOR_SET_DRAFTS: {
      return { ...state, drafts: { ...state.drafts, ...payload } }
    }

    case Actions.PLAN_EDITOR_SET_DRAFT_LOCATIONS: {
      return setDraftLocations(state, payload.rootSubnetId, payload.rootLocations)
    }

    case Actions.PLAN_EDITOR_CLEAR_DRAFTS:
      return { ...state, drafts: {} }

    case Actions.PLAN_EDITOR_UPDATE_DRAFT: {
      const updatedDrafts = { ...state.drafts }
      updatedDrafts[payload.subnetId] = payload
      return { ...state, drafts: updatedDrafts }
    }

    case Actions.PLAN_EDITOR_REMOVE_DRAFT: {
      return removeFromDraft (state, payload)
    }

    case Actions.PLAN_EDITOR_MERGE_DRAFT_PROPS: {
      return mergeDraftProps(state, payload)
    }

    case Actions.PLAN_EDITOR_ADD_SUBNETS:
      return { ...state, subnets: { ...state.subnets, ...payload } }

    case Actions.PLAN_EDITOR_UPDATE_SUBNET_BOUNDARY:
      return updateSubnetBoundary(state, payload.subnetId, payload.geometry)

    case Actions.PLAN_EDITOR_SET_SUBNET_FEATURES:
      return setSubnetFeatures(state, payload)

    case Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES:
      return { ...state, subnetFeatures: { ...state.subnetFeatures, ...payload } }

    case Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURES:
      return removeSubnetFeatures(state, payload)

    case Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE:
      return removeSubnetFeatures(state, [payload])

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

    case Actions.PLAN_EDITOR_SET_PLAN_THUMB_INFORMATION:
      return setPlanThumbInformation(state, payload)
    
    case Actions.PLAN_EDITOR_UPDATE_PLAN_THUMB_INFORMATION:
      return updatePlanThumbInformation(state, payload)
      
    case Actions.PLAN_EDITOR_SET_CURSOR_LOCATION_IDS:
      return { ...state, cursorLocationIds: payload}

    case Actions.PLAN_EDITOR_ADD_CURSOR_EQUIPMENT_IDS:
      return { ...state, cursorEquipmentIds: [...state.cursorEquipmentIds, ...payload] }

    case Actions.PLAN_EDITOR_CLEAR_CURSOR_EQUIPMENT_IDS:
      return { ...state, cursorEquipmentIds: [] }

    case Actions.PLAN_EDITOR_SET_FIBER_SELECTION:
      return { ...state, selectedFiber: payload }

    case Actions.PLAN_EDITOR_SET_FIBER_ANNOTATIONS:
      return { ...state, fiberAnnotations: { ...state.fiberAnnotations, ...payload}}

    case Actions.PLAN_EDITOR_SET_CLICK_LATLNG:
      return { ...state, clickedLatLng: payload }

    default:
      return state
  }
}

export default planEditorReducer
