import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import RfpOptions from './rfp-options.jsx'

export class RfpAnalyzer extends Component {
  constructor (props) {
    super(props)
    this.props.initialize()
  }

  render () {
    return <RfpOptions initialValues={this.props.rfpOptions} enableReinitialize />
  }

  componentWillUnmount () {
    this.props.clearState()
  }
}

RfpAnalyzer.propTypes = {
}

const mapStateToProps = (state) => ({
  rfpOptions: state.optimization.rfp.options
})

const mapDispatchToProps = dispatch => ({
  initialize: () => dispatch(RfpActions.initialize()),
  clearState: () => dispatch(RfpActions.clearState())
})

const RfpAnalyzerComponent = wrapComponentWithProvider(reduxStore, RfpAnalyzer, mapStateToProps, mapDispatchToProps)
export default RfpAnalyzerComponent
