import Actions from '../../common/actions'
import TransactionManager from './transaction-manager'
import Transaction from './transaction'
import AroHttp from '../../common/aro-http'

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
        dispatch(addTransactionEquipment(results[0].data))
        dispatch(addTransactionEquipmentBoundary(results[1].data))
      })
      .catch(err => console.error(err))
  }
}

function clearTransaction () {
  return {
    type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION
  }
}

function commitTransaction (transactionId) {
  return dispatch => {
    AroHttp.put(`/service/plan-transactions/${transactionId}`)
      .then(() => dispatch({
        type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION
      }))
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION
        })
      })
  }
}

function discardTransaction (transactionId) {
  return dispatch => {
    TransactionManager.discardTransaction(transactionId)
      .then(res => dispatch({
        type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION
      }))
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION
        })
      })
  }
}

function createEquipment (transactionId, feature) {
  return dispatch => {
    // Do a POST to send the equipment over to service
    AroHttp.post(`/service/plan-transactions/${transactionId}/modified-features/equipment`, feature)
      .then(result => {
        // Decorate the created equipment with some default values
        const createdEquipment = {
          crudAction: 'create',
          deleted: false,
          valid: true,
          feature: result.data
        }
        dispatch(addTransactionEquipment([createdEquipment]))
      })
      .catch(err => console.error(err))
  }
}

function modifyEquipment (transactionId, equipment) {
  return dispatch => {
    // Do a PUT to send the equipment over to service
    AroHttp.put(`/service/plan-transactions/${transactionId}/modified-features/equipment`, equipment.feature)
      .then(result => {
        // Decorate the created equipment with some default values
        const newEquipment = {
          ...equipment,
          feature: result.data
        }
        dispatch({
          type: Actions.PLAN_EDITOR_MODIFY_EQUIPMENT_NODES,
          payload: [newEquipment]
        })
      })
      .catch(err => console.error(err))
  }
}

function addTransactionEquipment (equipmentNodes) {
  return {
    type: Actions.PLAN_EDITOR_ADD_EQUIPMENT_NODES,
    payload: equipmentNodes
  }
}

function removeTransactionEquipment (objectId) {
  return {
    type: Actions.PLAN_EDITOR_REMOVE_EQUIPMENT_NODE,
    payload: objectId
  }
}

function addTransactionEquipmentBoundary (equipmentBoundaries) {
  return {
    type: Actions.PLAN_EDITOR_ADD_EQUIPMENT_BOUNDARY,
    payload: equipmentBoundaries
  }
}

function removeTransactionEquipmentBoundary (objectId) {
  return {
    type: Actions.PLAN_EDITOR_REMOVE_EQUIPMENT_BOUNDARY,
    payload: objectId
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

export default {
  commitTransaction,
  clearTransaction,
  discardTransaction,
  resumeOrCreateTransaction,
  createEquipment,
  modifyEquipment,
  addTransactionEquipment,
  removeTransactionEquipment,
  addTransactionEquipmentBoundary,
  removeTransactionEquipmentBoundary,
  setIsCalculatingSubnets,
  setIsCreatingObject,
  setIsModifyingObject,
  setIsDraggingFeatureForDrop
}
