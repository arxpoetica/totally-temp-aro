import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Checkbox, Group, Text, Button } from '@mantine/core'
import NetworkOptimizationActions from '../optimization/network-optimization/network-optimization-actions'
import PlanEditorActions from '../plan-editor/plan-editor-actions'

const _OptimizationModal = props => {

  const [checked, setChecked] = useState(false)

  const { 
    context,
    id,
    // innerProps,
    activePlan,
    transactionId,
    copyEphemeralPlan,
    modifyOptimization,
    commitTransaction,
    getActiveTransaction
  } = props

  useEffect(() => {
    getActiveTransaction()
    if (activePlan.ephemeral) {
      // This is an ephemeral plan...don't show any modals to the user...
      // instead copy this plan over to a new ephemeral plan
      // NOTE: in theory this is always safe because ephemeral plans can't
      // be edited or have a transaction...
      context.closeModal(id)
      copyEphemeralPlan(activePlan)
    }
  }, [])

  async function handleModify() {
    context.closeModal(id)

    // This is not an ephemeral plan...
    if (transactionId) await commitTransaction(transactionId)
    await modifyOptimization(activePlan)
  }

  const bodyText = transactionId
    ? 'Modifying will destroy any current changes. Continue?'
    : 'You are modifying a plan with a completed analysis. Overwrite?'

  return <>
    <p>{bodyText}</p>
    <Checkbox
      label="I understand that by continuing to modify, all plan changes will be lost."
      checked={checked}
      onChange={event => setChecked(event.currentTarget.checked)}
    />
    <Group position="right">
      <Button variant="outline" color="dark" onClick={() => context.closeModal(id)}>
        Cancel
      </Button>
      <Button color="red" onClick={handleModify} disabled={!checked}>
        Modify Plan
      </Button>
    </Group>
  </>
}

const mapStateToProps = (state) => ({
  activePlan: state.plan.activePlan,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
})

const mapDispatchToProps = dispatch => ({
  copyEphemeralPlan: plan => dispatch(NetworkOptimizationActions.copyEphemeralPlan(plan)),
  modifyOptimization: plan => dispatch(NetworkOptimizationActions.modifyOptimization(plan)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  getActiveTransaction: () => dispatch(PlanEditorActions.getActiveTransaction()),
})

export const OptimizationModal = connect(mapStateToProps, mapDispatchToProps)(_OptimizationModal)
