import React from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from '../plan-editor-actions'

const PlanTransactionTools = props => {

  const {
    isCommittingTransaction,
    fiberAnnotations,
    transactionId,
    discardTransaction,
  } = props

  return (
    <div className="text-center mb-2">
      <div className="btn-group">
        <button
          className="btn btn-light"
          onClick={() => checkAndCommitTransaction(props)}
          disabled={isCommittingTransaction}
        >
          <i className="fa fa-check-circle" />&nbsp;&nbsp;Commit
        </button>
        <button
          className="btn btn-light"
          onClick={() => discardTransaction(transactionId)}
        >
          <i className="fa fa-times-circle" />&nbsp;&nbsp;Discard
        </button>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  isCommittingTransaction: state.planEditor.isCommittingTransaction,

  fiberAnnotations: state.planEditor.fiberAnnotations,
})

const mapDispatchToProps = dispatch => ({
  commitTransaction: id => dispatch(PlanEditorActions.commitTransaction(id)),
  discardTransaction: id => dispatch(PlanEditorActions.discardTransaction(id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanTransactionTools)

function checkAndCommitTransaction({
  isCommittingTransaction,
  fiberAnnotations,
  transactionId,
  commitTransaction,
}) {
  if (isCommittingTransaction) {
    return
  }
  if (Object.keys(fiberAnnotations).length > 0) {
    swal({
      title: "Are you sure you want to Commit?",
      text: "If you've made any changes to the Feeder Fiber route, annotations will be lost.",
      type: 'warning',
      showCancelButton: true,
      closeOnConfirm: true,
      confirmButtonColor: '#fdbc80',
      confirmButtonText: 'Yes, Commit',
      cancelButtonText: 'Oops, nevermind.',
    }, confirm => {
      if (confirm) commitTransaction(transactionId)
    })
  } else commitTransaction(transactionId)
}

