import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../../common/constants'
import NetworkOptimizationInputFormMeta from './network-optimization-input-form-meta'
import ObjectEditor from '../../common/editor-interface/object-editor.jsx'

export class NetworkOptimizationInputFormProto extends Component {
  constructor (props) {
    super(props)
    this.meta = NetworkOptimizationInputFormMeta
  }

  render () {
    return <div>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <ObjectEditor metaData={this.meta} title={''} handleChange={(val, newVal, prevVal, propChain) => this.handleChange(newVal, prevVal, propChain)} leftIndent={11} displayOnly={this.props.displayOnly} ></ObjectEditor>
      </form>
    </div>
  }

  handleChange (newVal, prevVal, propChain) {
    switch (propChain) {
      case 'optimization.algorithm':
        this.onAlgorithmChange(newVal, prevVal, propChain)
        break
    }
  }

  onAlgorithmChange (newVal, prevVal, propChain) {
    console.log('change optimization.algorithm')
  }
}

let NetworkOptimizationInputForm = reduxForm({
  form: Constants.NETWORK_OPTIMIZATION_INPUT_FORM
})(NetworkOptimizationInputFormProto)

export default NetworkOptimizationInputForm
