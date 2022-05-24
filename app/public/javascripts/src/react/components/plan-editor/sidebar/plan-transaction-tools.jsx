import React from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from '../plan-editor-actions'
import PlanEditorSelectors from '../plan-editor-selectors'
import { constants } from '../shared'
const { DRAFT_STATES } = constants
import { Button, Menu, Alert } from '@mantine/core'
import { ProgressBar } from '../../common/progress-bar.jsx'
import { StateIcon } from '../../common/state-icon.jsx'

const DropdownCaret = () => {
  return <span>
    <style jsx>{`
      span {
        width: 10px;
        height: 6px;
        background-color: white;
        mask-image: url('/svg/dropdown-caret.svg');
        -webkit-mask-image: url('/svg/dropdown-caret.svg');
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
        mask-size: contain;
        -webkit-mask-size: contain;
      }
    `}</style>
  </span>
}

const PlanTransactionTools = props => {

  const {
    transactionId,
    discardTransaction,
    fiberAnnotations,
    draftsState,
    draftsLoadedProgress,
    isChangesSaved,
    isRecalculating,
    isCommittingTransaction,
  } = props

  const isLoading = !isChangesSaved || isRecalculating || isCommittingTransaction

  let stateText = 'changes saved'
  if (isRecalculating) stateText = 'recalculating...'
  else if (!isChangesSaved) stateText = 'saving changes...'

  const hasAnnotations = (
    Object.values(fiberAnnotations)
      .map(annotations => annotations.length > 0)
      .filter(Boolean)
  ).length > 0

  return (

    <div className="transaction-tools">

      {draftsState !== DRAFT_STATES.END_INITIALIZATION &&
        <div className="drafts-state">
          <ProgressBar progress={draftsLoadedProgress} />
          <Alert title="Initializing" color="yellow">
            Please wait while the plan initializes content for editing.
            We're performing several operations behind the scenes
            which will help future performance and caching.
          </Alert>
        </div>
      }

      {draftsState === DRAFT_STATES.END_INITIALIZATION && <>
        <div className="state">
          <StateIcon state={isLoading ? 'loading' : 'good'} size="sm"/>
          <div className="text">{stateText}</div>
        </div>

        <div className="columns">
          <div className="column">
            <Button
              fullWidth
              variant="default"
              onClick={() => discardTransaction(transactionId)}
              disabled={isLoading}
            >
              Discard
            </Button>
          </div>

          <div className="column">
            <Menu
              control={
                <Button
                  fullWidth
                  rightIcon={<DropdownCaret/>}
                  disabled={isLoading}
                >
                  Recalculate / Commit
                </Button>
              }
              size="xl"
              styles={{ root: { display: 'block' } }}
            >

              <Menu.Item
                onClick={() => recalculate({ ...props, hasAnnotations })}
                variant="outline"
                color={hasAnnotations ? 'red' : undefined}
                disabled={isLoading}
              >
                Recalulate Hubs &amp; Terminals
              </Menu.Item>

              <Menu.Item
                onClick={() => checkAndCommitTransaction({ ...props, hasAnnotations })}
                variant="outline"
                disabled={isLoading}
              >
                Commit Changes &amp; Exit
              </Menu.Item>

            </Menu>
          </div>
        </div>
      </>}

      <style jsx>{`
        .transaction-tools {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 0 20px;
        }
        .transaction-tools :global(.mantine-Progress-root) {
          margin: 0 0 12px;
        }
        .drafts-state {
          width: 100%;
          margin: 12px 0 0;
        }
        .state {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2px;
          margin: 0 0 15px;
          font-size: 12px;
          text-align: center;
        }
        .columns {
          display: flex;
          gap: 12px;
        }
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
  selectedSubnetId: state.planEditor.selectedSubnetId,
  fiberAnnotations: state.planEditor.fiberAnnotations || {},
  draftsState: state.planEditor.draftsState,
  draftProgressTuple: state.planEditor.draftProgressTuple,
  draftsLoadedProgress: PlanEditorSelectors.getDraftsLoadedProgress(state),
  isChangesSaved: PlanEditorSelectors.getIsChangesSaved(state),
  isRecalculating: state.planEditor.isRecalculating,
  isCommittingTransaction: state.planEditor.isCommittingTransaction,
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
  hasAnnotations,
  transactionId,
  commitTransaction,
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

function recalculate({
  hasAnnotations,
  transactionId,
  selectedSubnetId,
  recalculateSubnets,
}) {
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
    }, confirm => {
      if (confirm) recalculateSubnets(transactionId, [selectedSubnetId])
    })	
  } else {
    recalculateSubnets(transactionId, [selectedSubnetId])
  }
}
