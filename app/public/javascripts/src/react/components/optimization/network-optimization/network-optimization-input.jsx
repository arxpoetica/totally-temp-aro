import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkOptimizationActions from './network-optimization-actions'

export class NetworkOptimizationInput extends Component {
  render () {
    return <div>
      <button onClick={() => this.props.runOptimization()}>
        <i className='fa fa-bolt'></i> Run
      </button>
      <div>
        {JSON.stringify(this.props.optimizationInputs)}
      </div>
    </div>
  }





  

}

// NetworkOptimizationInput.propTypes = {
// }

const mapStateToProps = (state) => ({
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs
})

const mapDispatchToProps = dispatch => ({
  runOptimization: () => dispatch(NetworkOptimizationActions.runOptimization()),
  setOptimizationInputs: (inputs) => dispatch(NetworkOptimizationActions.setOptimizationInputs(inputs))
})

const NetworkOptimizationInputComponent = wrapComponentWithProvider(reduxStore, NetworkOptimizationInput, mapStateToProps, mapDispatchToProps)
export default NetworkOptimizationInputComponent
