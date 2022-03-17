/* globals swal */
import AroHttp from '../../common/aro-http'

export default class TransactionManager {
  // Workflow:
  // 1. If we don't have any transaction for this plan, create one
  // 2. If we have multiple transactions for this plan, we are in a bad state.
  //    Ask the user if they want to delete all but one.
  // 3. If we have a transaction for this plan BUT not for the current user
  //    a. Ask if we want to steal the transaction. If yes, steal it. If not, show error message
  // 4. If we have a transaction for this plan and for this user, resume it
  static async resumeOrCreateTransaction (planId, userId, sessionId, draftExists) {
    try {
      // Get a list of all open transactions in the system
      // (Do NOT send in userId so we get transactions across all users)
      const url = `/service/plan-transaction?plan_id=${planId}`
      const result = await AroHttp.get(url)
      const transactionsForPlan = result.data.filter((item) => item.planId === planId)
      const transactionsForUserAndPlan = transactionsForPlan.filter((item) => item.userId === userId)
      if (transactionsForPlan.length > 1) {
        // We have multiple transactions for this plan.
        // We should never get into this state, but can happen
        // due to race conditions, network issues, etc.
        return TransactionManager.deleteBadTransactionsAndCreateNew(transactionsForPlan, planId, sessionId)
      } else if (transactionsForPlan.length === 0 || transactionsForUserAndPlan.length === 1) {
        // 1. The draft already exists in state.
        // Resume the already existing transaction.
        if (draftExists) return { data: transactionsForUserAndPlan[0] }
        // 2. Somehow we've lost the draft,
        // most likely from a page refresh
        // We need to re-send the `POST` to resume
        return AroHttp.post(`/service/plan-transactions?session_id=${sessionId}`, { planId })
      } else if (transactionsForPlan.length === 1) {
        // We have one open transaction for this plan,
        // but it was not started by this user. Ask the user what to do.
        const transaction = transactionsForPlan[0]
        return TransactionManager.stealOrRejectTransaction(transaction, planId, sessionId)
      }

    } catch (error) {
        // For transaction resume errors, log it and rethrow the exception
        console.error(error)
        return error
    }
  }

  static deleteBadTransactionsAndCreateNew (transactionsForPlan, currentPlanId, sessionId) {
    // Sometimes we will get into a state where we have multiple open transactions for the same plan. Ask the
    // user whether they want to delete all and start a new transaction
    return new Promise((resolve, reject) => {
      swal({
        title: 'Multiple transactions',
        text: `There are multiple open transactions for this plan. You can only have one open transaction per plan. Delete older open transactions and start a new one?`,
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete old',
        cancelButtonText: 'No',
        showCancelButton: true,
        closeOnConfirm: true
      }, (deleteOldTransactions) => {
        if (deleteOldTransactions) {
          var deletePromises = []
          transactionsForPlan.forEach(transactionForPlan => {
            deletePromises.push(
              AroHttp.delete(`/service/plan-transactions/transaction/${transactionForPlan.id}`)
            )
          })
          Promise.all(deletePromises)
            .then(res => AroHttp.post(`/service/plan-transactions?session_id=${sessionId}`, { planId: currentPlanId }))
            .then(res => resolve(res))
            .catch(err => reject(err))
        } else {
          reject(new Error('Unable to delete older transactions. Please try again later.'))
        }
      })
    })
  }

  // Ask the user if they want to "steal" and existing transaction from another user.
  // If yes, steal it. If not, throw a rejection
  static stealOrRejectTransaction (transaction, planId, sessionId) {
    // Get the name of the current owner of the transaction
    return AroHttp.get(`/service/odata/userentity?$select=firstName,lastName&$filter=id eq ${transaction.userId}`)
      .then(result => {
        const user = result.data[0]
        return new Promise((resolve, reject) => {
          swal({
            title: 'Overwrite transaction?',
            text: `${user.firstName} ${user.lastName} already has a transaction open for this plan. Do you want to overwrite this transaction?`,
            type: 'warning',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, overwrite',
            cancelButtonText: 'No',
            showCancelButton: true,
            closeOnConfirm: true
          }, (stealTransaction) => {
            resolve(stealTransaction)
          })
        })
      })
      .then((stealTransaction) => {
        if (stealTransaction) {
          return AroHttp.post(`/service/plan-transactions?force=true&session_id=${sessionId}`, { planId: planId })
        } else {
          return Promise.reject(new Error('User does not want to steal the transaction'))
        }
      })
  }

  static discardTransaction (transactionId) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Discard transaction?',
        text: `Are you sure you want to discard transaction with ID ${transactionId}`,
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'No',
        showCancelButton: true,
        closeOnConfirm: true
      }, (deleteTransaction) => {
        if (deleteTransaction) {
          // The user has confirmed that the transaction should be deleted
          AroHttp.delete(`/service/plan-transactions/transaction/${transactionId}`)
            .then(() => resolve())
            .catch(err => {
              console.error(err)
              reject(err)
            })
        } else {
          reject(new Error(`The user does not want to discard the transaction`))
        }
      })
    })
  }
}
