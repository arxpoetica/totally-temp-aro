import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkOptimizationActions from './network-optimization-actions'
import PlanEditorActions from '../../plan-editor/plan-editor-actions'
import SelectionActions from '../../selection/selection-actions'
import { EditorInterface, EditorInterfaceItem } from './editor-interface.jsx'
import PlanTargetListComponent from '../../selection/plan-target-list.jsx'
import NetworkOptimizationInputForm from './network-optimization-input-form.jsx'
import NetworkOptimizationButton from './network-optimization-button.jsx'
import NetworkOptimizationSelectors from './network-optimization-selectors'
import { Notifier } from '../../../common/notifications'
import Constants from '../../../common/constants'
import DropdownList from 'react-widgets/lib/DropdownList'
import { useModals } from '@mantine/modals'

export function NetworkOptimizationInput(props) {

  const modals = useModals()

  const requestRunOptimization = () => {
    if (props.transactionId) {
      // open a swal
      swal({
        title: 'Unsaved Changes',
        text: 'Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Save and Run', // 'Yes',
        showCancelButton: true,
        cancelButtonText: 'Back', // 'No',
        closeOnConfirm: true,
      }, result => {
        if (result) {
          // save transaction
          props.commitTransaction(props.transactionId)
            .then(() => onRunOptimization())
            .catch(error => Notifier.error(error))
        }
      })
    } else {
      onRunOptimization()
    }
  }

  function onRunOptimization() {
    // load settings from otehr spots in the UI
    var inputs = props.additionalOptimizationInputs

    //sets active filters to validated ones
    props.setActiveFilters(props.validatedFilters)
    props.runOptimization(inputs, props.userId)
  }

  function onCancelOptimization() {
    props.cancelOptimization(props.planId, props.optimizationId)
  }

  function onSelectionModeChange(val, event) {
    props.setSelectionTypeById(val.id)
  }

  // TODO: this is also in analysis-mode.js
  function areControlsEnabled() {
    return props.planState === Constants.PLAN_STATE.START_STATE
      || props.planState === Constants.PLAN_STATE.INITIALIZED
  }

  function onModifyOptimization() {
    modals.openContextModal('OptimizationModal', {
      title: props.transactionId
        ? 'This plan has uncommitted changes.'
        : 'Overwrite the existing plan.',
      size: 'lg',
    })
  }

  return (
    <div style={{ paddingRight: '10px', paddingTop: '8px', paddingLeft: '10px' }}>
      <NetworkOptimizationButton
        onRun={() => requestRunOptimization()}
        onCancel={() => onCancelOptimization()}
        onModify={() => onModifyOptimization()}
        isCanceling={props.isCanceling}
        isCommittingTransaction={props.isCommittingTransaction}
      />
      <NetworkOptimizationInputForm
        handleChange={() => {}}
        initialValues={props.optimizationInputs}
        networkAnalysisTypeId={props.networkAnalysisTypeId}
        displayOnly={!areControlsEnabled()} enableReinitialize />

      <EditorInterface title="Routing Selection">
        <EditorInterfaceItem subtitle="Selection Type">
          <DropdownList
            data={props.allSelectionModes}
            valueField='id'
            textField='description'
            value={props.activeSelectionModeId}
            readOnly={!areControlsEnabled()}
            onChange={(val, event) => onSelectionModeChange(val, event)} />
        </EditorInterfaceItem>
        <EditorInterfaceItem>
          <PlanTargetListComponent displayOnly={!areControlsEnabled()} />
        </EditorInterfaceItem>
      </EditorInterface>

    </div>
  )

}

const mapStateToProps = (state) => ({
  userId: state.user.loggedInUser.id,
  planId: state.plan.activePlan.id,
  planState: state.plan.activePlan.planState,
  // locationsLayers: state.mapLayers.location,
  optimizationId: state.optimization.networkOptimization.optimizationId,
  isCanceling: state.optimization.networkOptimization.isCanceling,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  allSelectionModes: NetworkOptimizationSelectors.getAllSelectionModes(state),
  activeSelectionModeId: state.selection.activeSelectionMode.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  activePlan: state.plan.activePlan,
  networkAnalysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type,
  activeFilters: state.optimization.networkOptimization.activeFilters,
  clientName: state.configuration.system.ARO_CLIENT,
  validatedFilters: NetworkOptimizationSelectors.getValidatedFilters(state),
  additionalOptimizationInputs: NetworkOptimizationSelectors.getAdditionalOptimizationInputs(state),
  isCommittingTransaction: state.planEditor.isCommittingTransaction
})

const mapDispatchToProps = dispatch => ({
  commitTransaction: transactionId => { return dispatch(PlanEditorActions.commitTransaction(transactionId)) },
  runOptimization: (inputs, userId) => dispatch(NetworkOptimizationActions.runOptimization(inputs, userId)),
  cancelOptimization: (planId, optimizationId) => dispatch(NetworkOptimizationActions.cancelOptimization(planId, optimizationId)),
  setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId)),
  setActiveFilters: (filters) => dispatch(NetworkOptimizationActions.setActiveFilters(filters)),
})

const NetworkOptimizationInputComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationInput, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationInputComponent
