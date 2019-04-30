import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkAnalysisActions from './network-analysis-actions'

export class NetworkAnalysisOutput extends Component {
  constructor (props) {
    super(props)
    this.props.loadReport(this.props.planId)
  }

  render () {
    return <div id='divNetworkAnalysisOutput'>
      {JSON.stringify(this.props.reportMetaData)}
      <br />
      {JSON.stringify(this.props.report)}
    </div>
  }

  componentWillUnmount () {
    this.props.clearOutput()
  }
}

NetworkAnalysisOutput.propTypes = {
  planId: PropTypes.number,
  reportMetaData: PropTypes.object,
  report: PropTypes.array
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  reportMetaData: state.optimization.networkAnalysis.reportMetaData,
  report: state.optimization.networkAnalysis.report
})

const mapDispatchToProps = dispatch => ({
  loadReport: planId => dispatch(NetworkAnalysisActions.loadReport(planId)),
  clearOutput: () => dispatch(NetworkAnalysisActions.clearOutput())
})

const NetworkAnalysisOutputComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisOutput, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisOutputComponent
