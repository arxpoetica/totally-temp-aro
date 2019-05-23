import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import RfpOptions from './rfp-options.jsx'
import RfpTargets from './rfp-targets.jsx'
import RfpStatusTypes from './constants'

export class RfpAnalyzer extends Component {
  constructor (props) {
    super(props)
    this.props.initialize()
  }

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

  componentWillUnmount () {
    this.props.clearState()
  }
}

RfpAnalyzer.propTypes = {
}

const mapStateToProps = (state) => ({
  rfpOptions: state.optimization.rfp.options,
  status: state.optimization.rfp.status
})

const mapDispatchToProps = dispatch => ({
  initialize: () => dispatch(RfpActions.initialize()),
  clearState: () => dispatch(RfpActions.clearState())
})

const RfpAnalyzerComponent = wrapComponentWithProvider(reduxStore, RfpAnalyzer, mapStateToProps, mapDispatchToProps)
export default RfpAnalyzerComponent
