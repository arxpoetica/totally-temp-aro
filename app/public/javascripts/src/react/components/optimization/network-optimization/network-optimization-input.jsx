import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkOptimizationActions from './network-optimization-actions'
import PlanTargetListComponent from '../../selection/plan-target-list.jsx'
import NetworkOptimizationInputForm from './network-optimization-input-form.jsx'
import Constants from '../../../common/constants'
import AngConstants from '../../../../components/common/constants' // ToDo: merge constants, put in Redux?
import { getFormValues } from 'redux-form'
const networkOptimizationInputSelector = getFormValues(Constants.NETWORK_OPTIMIZATION_INPUT_FORM)

export class NetworkOptimizationInput extends Component {
  render () {
    return <div style={{ paddingRight: '16px' }}>
      <button onClick={() => this.onRunOptimization()}>
        <i className='fa fa-bolt'></i> Run
      </button>
      <NetworkOptimizationInputForm initialValues={this.props.optimizationInputs} displayOnly={!this.areControlsEnabled()} enableReinitialize />
      <div className='ei-property-item'>
        <div className='ei-property-label'>Selected Geographies</div>
        <div className='ei-property-value'><PlanTargetListComponent /></div>
      </div>
    </div>
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
    inputs.planId = this.props.planId
    inputs.locationConstraints = {}
    inputs.locationConstraints.locationTypes = []
    this.props.locationsLayers.forEach(locationsLayer => {
      if (locationsLayer.checked) inputs.locationConstraints.locationTypes.push(locationsLayer.plannerKey)
    })

    return inputs
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
  locationsLayers: state.mapLayers.location,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  modifiedNetworkOptimizationInput: networkOptimizationInputSelector(state)
})

const mapDispatchToProps = dispatch => ({
  runOptimization: (inputs, userId) => dispatch(NetworkOptimizationActions.runOptimization(inputs, userId))
})

const NetworkOptimizationInputComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationInput, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationInputComponent
