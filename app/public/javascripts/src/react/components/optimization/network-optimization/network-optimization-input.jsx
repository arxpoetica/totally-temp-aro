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
import Constants from '../../../common/constants'
import DropdownList from 'react-widgets/lib/DropdownList'

export class NetworkOptimizationInput extends Component {
  render () {
    return (
      <div style={{ paddingRight: '16px', paddingTop: '8px' }}>
        <NetworkOptimizationButton
          onRun={() => this.requestRunOptimization()}
          onModify={() => this.onModifyOptimization()}
          onCancel={() => this.onCancelOptimization()}
          isCanceling={this.props.isCanceling}
        />
        <NetworkOptimizationInputForm
          handleChange={(newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
          initialValues={this.props.optimizationInputs}
          networkAnalysisTypeId={this.props.networkAnalysisTypeId}
          displayOnly={!this.areControlsEnabled()} enableReinitialize />

        <EditorInterface title="Routing Selection">
          <EditorInterfaceItem subtitle="Selection Type">
            <DropdownList
              data={this.props.allSelectionModes}
              valueField='id'
              textField='description'
              value={this.props.activeSelectionModeId}
              readOnly={!this.areControlsEnabled()}
              onChange={(val, event) => this.onSelectionModeChange(val, event)} />
          </EditorInterfaceItem>
          <EditorInterfaceItem>
            <PlanTargetListComponent displayOnly={!this.areControlsEnabled()} />
          </EditorInterfaceItem>
        </EditorInterface>

      </div>
    )
  }

  requestRunOptimization () {
    if (this.props.transaction) {
      // open a swal
      swal({
        title: 'Unsaved Changes',
        text: 'Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Save and Run', // 'Yes',
        showCancelButton: true,
        cancelButtonText: 'Back', // 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          // save transaction
          this.props.commitTransaction(this.props.transaction.id)
            .then(() => {
              this.onRunOptimization()
            })
            .catch(err => {
              console.error(err)
            })
        }
      })
    } else {
      this.onRunOptimization()
    }
  }

  onRunOptimization () {
    // load settings from otehr spots in the UI
    var inputs = this.props.additionalOptimizationInputs

    //sets active filters to validated ones
    this.props.setActiveFilters(this.props.validatedFilters)
    this.props.runOptimization(inputs, this.props.userId)
  }

  onCancelOptimization () {
    this.props.cancelOptimization(this.props.planId, this.props.optimizationId)
  }

  handleChange (newVal, prevVal, propChain) {
    // console.log('--- from parent ---')
    // console.log([newVal, prevVal, propChain])
  }

  onSelectionModeChange (val, event) {
    this.props.setSelectionTypeById(val.id)
  }

  // ToDo: this is also in analysis-mode.js
  areControlsEnabled () {
    return (this.props.planState === Constants.PLAN_STATE.START_STATE) || (this.props.planState === Constants.PLAN_STATE.INITIALIZED)
  }

  onModifyOptimization () {
    this.props.modifyOptimization(this.props.activePlan)
  }
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
  transaction: state.planEditor.transaction,
  activePlan: state.plan.activePlan,
  networkAnalysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type,
  activeFilters: state.optimization.networkOptimization.activeFilters,
  clientName: state.configuration.system.ARO_CLIENT,
  validatedFilters: NetworkOptimizationSelectors.getValidatedFilters(state),
  additionalOptimizationInputs: NetworkOptimizationSelectors.getAdditionalOptimizationInputs(state)
})

const mapDispatchToProps = dispatch => ({
  commitTransaction: transactionId => { return dispatch(PlanEditorActions.commitTransaction(transactionId)) },
  runOptimization: (inputs, userId) => dispatch(NetworkOptimizationActions.runOptimization(inputs, userId)),
  cancelOptimization: (planId, optimizationId) => dispatch(NetworkOptimizationActions.cancelOptimization(planId, optimizationId)),
  setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId)),
  modifyOptimization: (activePlan) => dispatch(NetworkOptimizationActions.modifyOptimization(activePlan)),
  setActiveFilters: (filters) => dispatch(NetworkOptimizationActions.setActiveFilters(filters)),
})

const NetworkOptimizationInputComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationInput, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationInputComponent
