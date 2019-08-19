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

export default {
  commitTransaction,
  clearTransaction,
  discardTransaction,
  resumeOrCreateTransaction,
  addTransactionEquipment,
  removeTransactionEquipment,
  addTransactionEquipmentBoundary,
  removeTransactionEquipmentBoundary,
  setIsCalculatingSubnets,
  setIsCreatingObject,
  setIsModifyingObject
}
