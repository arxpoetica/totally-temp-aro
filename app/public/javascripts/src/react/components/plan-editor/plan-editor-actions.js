import Actions from '../../common/actions'
import TransactionManager from './transaction-manager'
import Transaction from './transaction'
import AroHttp from '../../common/aro-http'
import MenuItemFeature from '../context-menu/menu-item-feature'
import MenuItemAction from '../context-menu/menu-item-action'
import ContextMenuActions from '../context-menu/actions'
import SelectionActions from '../selection/selection-actions'

function resumeOrCreateTransaction (planId, userId) {
  return dispatch => {
    TransactionManager.resumeOrCreateTransaction(planId, userId)
      .then(result => {
        dispatch({
          type: Actions.PLAN_EDITOR_SET_TRANSACTION,
          payload: Transaction.fromServiceObject(result.data)
        })
        const transactionId = result.data.id
        return Promise.all([
          AroHttp.get(`/service/plan-transactions/${transactionId}/transaction-features/equipment`),
          AroHttp.get(`/service/plan-transactions/${transactionId}/transaction-features/equipment_boundary`)
        ])
      })
      .then(results => {
        dispatch(addTransactionFeatures(results[0].data))
        dispatch(addTransactionFeatures(results[1].data))
      })
      .catch(err => console.error(err))
  }
}

function clearTransaction () {
  return dispatch => {
    dispatch({ type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION })
    dispatch({
      type: Actions.SELECTION_SET_PLAN_EDITOR_FEATURES,
      payload: []
    })
    dispatch(setIsCommittingTransaction(false))
  }
}

function commitTransaction (transactionId) {
  return dispatch => {
    dispatch(setIsCommittingTransaction(true))
    AroHttp.put(`/service/plan-transactions/${transactionId}`)
      .then(() => dispatch(clearTransaction()))
      .catch(err => {
        console.error(err)
        dispatch(clearTransaction())
      })
  }
}

function discardTransaction (transactionId) {
  return dispatch => {
    dispatch(setIsCommittingTransaction(true))
    TransactionManager.discardTransaction(transactionId)
      .then(() => dispatch(clearTransaction()))
      .catch(err => {
        console.error(err)
        dispatch(clearTransaction())
      })
  }
}

function createFeature (featureType, transactionId, feature) {
  return dispatch => {
    // Do a POST to send the equipment over to service
    AroHttp.post(`/service/plan-transactions/${transactionId}/modified-features/${featureType}`, feature)
      .then(result => {
        // Decorate the created feature with some default values
        const createdFeature = {
          crudAction: 'create',
          deleted: false,
          valid: true,
          feature: result.data
        }
        dispatch(addTransactionFeatures([createdFeature]))
      })
      .catch(err => console.error(err))
  }
}

function modifyFeature (featureType, transactionId, feature) {
  return dispatch => {
    // Do a PUT to send the equipment over to service
    AroHttp.put(`/service/plan-transactions/${transactionId}/modified-features/${featureType}`, feature.feature)
      .then(result => {
        // Decorate the created feature with some default values
        const newFeature = {
          ...feature,
          feature: result.data
        }
        dispatch({
          type: Actions.PLAN_EDITOR_MODIFY_FEATURES,
          payload: [newFeature]
        })
      })
      .catch(err => console.error(err))
  }
}

function deleteTransactionFeature (transactionId, featureType, transactionFeature) {
  return dispatch => {
    return AroHttp.delete(`/service/plan-transactions/${transactionId}/modified-features/${featureType}/${transactionFeature.feature.objectId}`)
      .then(result => dispatch({
        type: Actions.PLAN_EDITOR_DELETE_TRANSACTION_FEATURE,
        payload: transactionFeature.feature.objectId
      }))
      .catch(err => console.error(err))
  }
}

function addTransactionFeatures (features) {
  return {
    type: Actions.PLAN_EDITOR_ADD_FEATURES,
    payload: features
  }
}

function showContextMenuForEquipment (planId, transactionId, selectedBoundaryTypeId, equipmentObjectId, x, y) {
  return dispatch => {
    // Get details on the boundary (if any) for this equipment
    AroHttp.get(`/boundary/for_network_node/${planId}/${equipmentObjectId}/${selectedBoundaryTypeId}`)
      .then(result => {
        var menuActions = []
        var isAddBoundaryAllowed = (result.data.length === 0) // No results for this combination of planid, object_id, selectedBoundaryTypeId. Allow users to add boundary
        if (isAddBoundaryAllowed) {
          menuActions.push(new MenuItemAction('ADD_BOUNDARY', 'Add boundary', 'PlanEditorActions', 'startDrawingBoundaryFor', equipmentObjectId))
        }
        menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteTransactionFeature', transactionId, 'equipment', equipmentObjectId))
        const menuItemFeature = new MenuItemFeature('EQUIPMENT', 'Equipment', menuActions)
        // Show context menu
        dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
        dispatch(ContextMenuActions.showContextMenu(x, y))
      })
      .catch(err => console.error(err))
  }
}

function showContextMenuForEquipmentBoundary (transactionId, equipmentObjectId, x, y) {
  return dispatch => {
    var menuActions = []
    menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteTransactionFeature', transactionId, 'equipment_boundary', equipmentObjectId))
    const menuItemFeature = new MenuItemFeature('BOUNDARY', 'Equipment Boundary', menuActions)
    // Show context menu
    dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
    dispatch(ContextMenuActions.showContextMenu(x, y))
  }
}

function viewFeatureProperties (featureType, planId, objectId, transactionFeatures) {
  return dispatch => {
    var equipmentPromise = null
    if (transactionFeatures[objectId]) {
      equipmentPromise = Promise.resolve()
    } else {
      equipmentPromise = AroHttp.get(`/service/plan-feature/${planId}/${featureType}/${objectId}`)
        .then(result => {
          // Decorate the equipment with some default values. Technically this is not yet "created" equipment
          // but will have to do for now.
          const createdEquipment = {
            crudAction: 'create',
            deleted: false,
            valid: true,
            feature: result.data
          }
          return dispatch(addTransactionFeatures([createdEquipment]))
        })
    }
    // At this point we are guaranteed to have a created equipment object
    equipmentPromise
      .then(result => dispatch(SelectionActions.setPlanEditorFeatures([objectId])))
      .catch(err => console.error(err))
  }
}

function startDrawingBoundaryFor (equipmentObjectId) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR,
    payload: equipmentObjectId
  }
}

function stopDrawingBoundary () {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR,
    payload: null
  }
}

function setIsCalculatingSubnets (isCalculatingSubnets) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS,
    payload: isCalculatingSubnets
  }
}

function setIsCreatingObject (isCreatingObject) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CREATING_OBJECT,
    payload: isCreatingObject
  }
}

function setIsModifyingObject (isModifyingObject) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_MODIFYING_OBJECT,
    payload: isModifyingObject
  }
}

function setIsDraggingFeatureForDrop (isDraggingFeatureForDrop) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP,
    payload: isDraggingFeatureForDrop
  }
}

function setIsEditingFeatureProperties (isEditingFeatureProperties) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES,
    payload: isEditingFeatureProperties
  }
}

function setIsCommittingTransaction (isCommittingTransaction) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION,
    payload: isCommittingTransaction
  }
}

export default {
  commitTransaction,
  clearTransaction,
  discardTransaction,
  resumeOrCreateTransaction,
  createFeature,
  modifyFeature,
  deleteTransactionFeature,
  addTransactionFeatures,
  showContextMenuForEquipment,
  showContextMenuForEquipmentBoundary,
  viewFeatureProperties,
  startDrawingBoundaryFor,
  stopDrawingBoundary,
  setIsCalculatingSubnets,
  setIsCreatingObject,
  setIsModifyingObject,
  setIsDraggingFeatureForDrop,
  setIsEditingFeatureProperties,
  setIsCommittingTransaction
}
