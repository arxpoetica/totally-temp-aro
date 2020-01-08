import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
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
    // ToDo: the maxHeight style bit needs to go into the parent modal
    //  along with the close button
    return <div>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <ObjectEditor metaData={this.meta} title={'Net Config'} leftIndent={11}></ObjectEditor>
      </form>
    </div>
  }
}

let NetworkOptimizationInputForm = reduxForm({
  form: Constants.NETWORK_OPTIMIZATION_INPUT_FORM
})(NetworkOptimizationInputFormProto)

export default NetworkOptimizationInputForm
