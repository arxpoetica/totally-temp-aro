import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpOptions from './rfp-options.jsx'
import RfpTargets from './rfp-targets.jsx'
import RfpStatusTypes from './constants'

export class RfpAnalyzer extends Component {
  render () {
    return <div>
      <RfpOptions initialValues={this.props.rfpOptions} enableReinitialize />
      <RfpTargets />
      {
        this.props.status === RfpStatusTypes.UNINITIALIZED
          ? null
          : <div className='disable-sibling-controls' />
      }
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
