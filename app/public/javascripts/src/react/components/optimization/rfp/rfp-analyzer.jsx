import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpOptions from './rfp-options.jsx'
import RfpTargets from './rfp-targets.jsx'
import RfpStatusTypes from './constants'

export class RfpAnalyzer extends Component {
  render () {
    var displayOnly = this.props.status !== RfpStatusTypes.UNINITIALIZED
    return <div>
      <RfpOptions initialValues={this.props.rfpOptions} enableReinitialize displayOnly={displayOnly} />
      <RfpTargets displayOnly={displayOnly} />
    </div>
  }
}

RfpAnalyzer.propTypes = {
}

const mapStateToProps = (state) => ({
  rfpOptions: state.optimization.rfp.options,
  status: state.optimization.rfp.status
})

const mapDispatchToProps = dispatch => ({
})

const RfpAnalyzerComponent = wrapComponentWithProvider(reduxStore, RfpAnalyzer, mapStateToProps, mapDispatchToProps)
export default RfpAnalyzerComponent
