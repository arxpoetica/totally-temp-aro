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

export default {
  commitTransaction,
  discardTransaction,
  resumeOrCreateTransaction
}
