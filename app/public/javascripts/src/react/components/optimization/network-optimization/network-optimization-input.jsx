import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkOptimizationActions from './network-optimization-actions'
import SelectionActions from '../../selection/selection-actions'
import PlanTargetListComponent from '../../selection/plan-target-list.jsx'
import { createSelector } from 'reselect'
import NetworkOptimizationInputForm from './network-optimization-input-form.jsx'
import NetworkOptimizationButton from './network-optimization-button.jsx'
import Constants from '../../../common/constants'
import AngConstants from '../../../../components/common/constants' // ToDo: merge constants, put in Redux?
import DropdownList from 'react-widgets/lib/DropdownList'
import { getFormValues } from 'redux-form'

const networkOptimizationInputSelector = getFormValues(Constants.NETWORK_OPTIMIZATION_INPUT_FORM)
const getSelectionModes = state => state.selection.selectionModes
const getAllSelectionModes = createSelector([getSelectionModes], (selectionModes) => JSON.parse(JSON.stringify(selectionModes)).filter(mode => mode.id !== 'ALL_PLAN_AREAS'))

export class NetworkOptimizationInput extends Component {
  render () {
    return (
      <div style={{ paddingRight: '16px', paddingTop: '8px' }}>
        <NetworkOptimizationButton
          onRun={() => this.onRunOptimization()}
          onModify={() => this.props.onModify()}
          onCancel={() => this.onCancelOptimization()}
          isCanceling={this.props.isCanceling}
        />
        <NetworkOptimizationInputForm
          handleChange={(newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)}
          initialValues={this.props.optimizationInputs}
          networkAnalysisTypeId={this.props.networkAnalysisTypeId}
          displayOnly={!this.areControlsEnabled()} enableReinitialize />

        <div className='ei-header ei-no-pointer' style={{ marginBottom: '0px' }}>Geography Selection</div>
        <div className='ei-gen-level ei-internal-level' style={{ paddingLeft: '11px' }}>
          <div className='ei-items-contain'>
            <div className='ei-property-item'>
              <div className='ei-property-label'>Geography Type</div>
              <div className='ei-property-value'>
                <DropdownList
                  data={this.props.allSelectionModes}
                  valueField='id'
                  textField='description'
                  value={this.props.activeSelectionModeId}
                  readOnly={!this.areControlsEnabled()}
                  onChange={(val, event) => this.onSelectionModeChange(val, event)} />
              </div>
            </div>
            <div className='ei-property-item'>
              <div className='ei-property-label'>Selected Geographies</div>
              <div className='ei-property-value'><PlanTargetListComponent displayOnly={!this.areControlsEnabled()} /></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  onRunOptimization () {
    // load settings from otehr spots in the UI
    var inputs = this.selectAdditionalOptimizationInputs(this.props.modifiedNetworkOptimizationInput)
    this.props.runOptimization(inputs, this.props.userId)
  }

  selectAdditionalOptimizationInputs (optimizationInputs = {}) {
    // this doesn't need to be a selector, because we grab the info just before sending the request
    // if we do validation we'll need to make it a selector
    // plan.selection.planTargets are sent seperately to the server
    var inputs = JSON.parse(JSON.stringify(optimizationInputs))
    inputs.analysis_type = this.props.networkAnalysisTypeId
    inputs.planId = this.props.planId
    
    inputs.locationConstraints = JSON.parse(JSON.stringify(this.props.optimizationInputs.locationConstraints))
    inputs.locationConstraints.analysisSelectionMode = this.props.activeSelectionModeId

    return inputs
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

  areControlsEnabled () {
    return (this.props.planState === AngConstants.PLAN_STATE.START_STATE) || (this.props.planState === AngConstants.PLAN_STATE.INITIALIZED)
  }
}

// NetworkOptimizationInput.propTypes = {
// }

const mapStateToProps = (state) => ({
  userId: state.user.loggedInUser.id,
  planId: state.plan.activePlan.id,
  planState: state.plan.activePlan.planState,
  // locationsLayers: state.mapLayers.location,
  optimizationId: state.optimization.networkOptimization.optimizationId,
  isCanceling: state.optimization.networkOptimization.isCanceling,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  modifiedNetworkOptimizationInput: networkOptimizationInputSelector(state),
  allSelectionModes: getAllSelectionModes(state),
  activeSelectionModeId: state.selection.activeSelectionMode.id
})

const mapDispatchToProps = dispatch => ({
  runOptimization: (inputs, userId) => dispatch(NetworkOptimizationActions.runOptimization(inputs, userId)),
  cancelOptimization: (planId, optimizationId) => dispatch(NetworkOptimizationActions.cancelOptimization(planId, optimizationId)),
  setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
})

const NetworkOptimizationInputComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationInput, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationInputComponent
