import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpOptions from './rfp-options.jsx'

export class RfpAnalyzer extends Component {
  render () {
    return <RfpOptions initialValues={this.props.rfpOptions} />
  }
}

RfpAnalyzer.propTypes = {
}

const mapStateToProps = (state) => ({
  rfpOptions: state.optimization.rfp.options
})

const mapDispatchToProps = dispatch => ({
})

const RfpAnalyzerComponent = wrapComponentWithProvider(reduxStore, RfpAnalyzer, mapStateToProps, mapDispatchToProps)
export default RfpAnalyzerComponent
