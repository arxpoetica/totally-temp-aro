import React from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from '../plan-editor-actions'
import { Button, Menu } from '@mantine/core'
import { StateIcon } from '../../common/state-icon.jsx'

const PlanTransactionTools = props => {

  const {
    isCommittingTransaction,
    transactionId,
    discardTransaction,
  } = props

  return (

    <div className="transaction-tools">
      <div className="state">
        <StateIcon state="warn" onClick={() => {}} />
      </div>

      <div className="columns">
        <div className="column">
          <Button
            fullWidth
            variant="default"
            onClick={() => discardTransaction(transactionId)}
          >
            Cancel
          </Button>
        </div>

        <div className="column">
          {/* &nbsp;&nbsp;&gt; */}
          <Menu
            control={
              <Button fullWidth>
                Commit Actions
              </Button>
            }
            size="xl"
            styles={{ root: { display: 'block' } }}
          >
            <Menu.Item
              onClick={() => console.log('TODO:')}
              variant="default"
            >
              Recalulate Hubs &amp; Terminals
            </Menu.Item>
            <Menu.Item
              onClick={() => checkAndCommitTransaction(props)}
              variant="default"
              disabled={isCommittingTransaction}
            >
              Commit all changes &amp; run plan
            </Menu.Item>
          </Menu>
        </div>
      </div>

      <style jsx>{`
        .transaction-tools {
          margin: 0 0 20px;
        }
        .state {
          margin: 0 0 6px;
          text-align: center;
        }
        .columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .column {
        }
      `}</style>

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
