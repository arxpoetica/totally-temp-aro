import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkOptimizationActions from './network-optimization-actions'
import NetworkOptimizationInputForm from './network-optimization-input-form.jsx'
import Constants from '../../../common/constants'
import { getFormValues } from 'redux-form'
const networkOptimizationInputSelector = getFormValues(Constants.NETWORK_OPTIMIZATION_INPUT_FORM)

export class NetworkOptimizationInput extends Component {
  render () {
    return <div style={{ paddingRight: '16px' }}>
      <button onClick={() => this.onRunOptimization()}>
        <i className='fa fa-bolt'></i> Run
      </button>
      <div>
        {JSON.stringify(this.props.optimizationInputs)}
      </div>
      <NetworkOptimizationInputForm initialValues={this.props.optimizationInputs} enableReinitialize />
    </div>
  }

  onRunOptimization () {
    this.props.setOptimizationInputs(this.props.modifiedNetworkOptimizationInput)
  }
}

// NetworkOptimizationInput.propTypes = {
// }

const mapStateToProps = (state) => ({
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  modifiedNetworkOptimizationInput: networkOptimizationInputSelector(state)
})

const mapDispatchToProps = dispatch => ({
  runOptimization: () => dispatch(NetworkOptimizationActions.runOptimization()),
  setOptimizationInputs: (inputs) => dispatch(NetworkOptimizationActions.setOptimizationInputs(inputs))
})

const NetworkOptimizationInputComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationInput, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationInputComponent
