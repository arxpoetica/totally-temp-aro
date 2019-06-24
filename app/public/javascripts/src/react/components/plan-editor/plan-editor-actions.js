import Actions from '../../common/actions'
import TransactionManager from './transaction-manager'
import Transaction from './transaction'
import AroHttp from '../../common/aro-http'

function resumeOrCreateTransaction (planId, userId) {
  return dispatch => {
    TransactionManager.resumeOrCreateTransaction(planId, userId)
      .then(result => dispatch({
        type: Actions.PLAN_EDITOR_SET_TRANSACTION,
        payload: Transaction.fromServiceObject(result.data)
      }))
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

function addEquipmentNodes (equipmentNodes) {
  return {
    type: Actions.PLAN_EDITOR_ADD_EQUIPMENT_NODES,
    payload: equipmentNodes
  }
}

function removeEquipmentNode (objectId) {
  return {
    type: Actions.PLAN_EDITOR_REMOVE_EQUIPMENT_NODE,
    payload: objectId
  }
}

export default {
  commitTransaction,
  clearTransaction,
  discardTransaction,
  resumeOrCreateTransaction,
  addEquipmentNodes,
  removeEquipmentNode
}
