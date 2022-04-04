import React from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from '../plan-editor-actions'
import { Button, Menu } from '@mantine/core'
import PlanEditorSelectors from '../plan-editor-selectors'
import { StateIcon } from '../../common/state-icon.jsx'

const PlanTransactionTools = props => {

  const {
    isCommittingTransaction,
    transactionId,
    discardTransaction,
    selectedSubnetId,
    recalculateSubnets,
    isRecalcDone,
    fiberAnnotations,
  } = props

  const menuItemDisabled = !isRecalcDone || isCommittingTransaction
  const hasAnnotations = (
    Object.values(fiberAnnotations)
      .map(annotations => annotations.length > 0)
      .filter(Boolean)
  ).length > 0

  // TODO: move elsewhere
  const recalculate = () => {
    if (hasAnnotations) {
      swal({
        title: 'Are you sure you want to recalculate?',
        text: 'If you have made any changes to the Feeder Fiber route, annotations will be lost.',
        type: 'warning',
        showCancelButton: true,
        closeOnConfirm: true,
        confirmButtonColor: '#fdbc80',
        confirmButtonText: 'Yes, recalculate',
        cancelButtonText: 'Oops, nevermind.',
      }, (confirm) => {
        if (confirm) recalculateSubnets(transactionId, [selectedSubnetId])
      })	
    } else {
      recalculateSubnets(transactionId, [selectedSubnetId])
    }
  }

  return (

    <div className="transaction-tools">
      <div className="state">
        <StateIcon state={isRecalcDone ? 'good' : 'loading'} />
        <div className="text">{isRecalcDone ? 'changes saved' : 'recalculating...'}</div>
      </div>

      <div className="columns">
        <div className="column">
          <Button
            fullWidth
            variant="default"
            onClick={() => discardTransaction(transactionId)}
            disabled={menuItemDisabled}
          >
            Cancel
          </Button>
        </div>

        <div className="column">
          <Menu
            control={
              <Button fullWidth disabled={menuItemDisabled}>
                Commit Actions
              </Button>
            }
            size="xl"
            styles={{ root: { display: 'block' } }}
          >

            <Menu.Item
              onClick={() => recalculate()}
              variant="outline"
              color={hasAnnotations ? 'red' : undefined}
              disabled={menuItemDisabled}
            >
              Recalulate Hubs &amp; Terminals
            </Menu.Item>

            <Menu.Item
              onClick={() => checkAndCommitTransaction({ ...props, hasAnnotations })}
              variant="outline"
              disabled={menuItemDisabled}
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
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2px;
          margin: 0 0 6px;
          text-align: center;
        }
        .text {}
        .columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .column {}
        .transaction-tools :global(.mantine-Menu-item) {
          border-width: 1px;
          border-style: solid;
        }
      `}</style>

    </div>
  )
}

const mapStateToProps = state => ({
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  isCommittingTransaction: state.planEditor.isCommittingTransaction,
  fiberAnnotations: state.planEditor.fiberAnnotations || {},
  selectedSubnetId: state.planEditor.selectedSubnetId,
  isRecalcDone: PlanEditorSelectors.getIsRecalcDone(state),
})

const mapDispatchToProps = dispatch => ({
  commitTransaction: id => dispatch(PlanEditorActions.commitTransaction(id)),
  discardTransaction: id => dispatch(PlanEditorActions.discardTransaction(id)),
  recalculateSubnets: (transactionId, subnetIds) => {
    return dispatch(PlanEditorActions.recalculateSubnets(transactionId, subnetIds))
  },
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanTransactionTools)

function checkAndCommitTransaction({
  isCommittingTransaction,
  transactionId,
  commitTransaction,
  hasAnnotations,
}) {
  if (isCommittingTransaction) {
    return
  }
  if (hasAnnotations) {
    swal({
      title: 'Are you sure you want to Commit?',
      text: 'If you have made any changes to the Feeder Fiber route, annotations will be lost.',
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
