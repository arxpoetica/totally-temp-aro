import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import Chart from 'chart.js'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkAnalysisActions from './network-analysis-actions'

export class NetworkAnalysisOutput extends Component {
  constructor (props) {
    super(props)
    this.props.loadReport(this.props.planId)
    this.chartRef = React.createRef()
  }

  render () {
    return <div>
      <canvas ref={this.chartRef} />
    </div>
  }

  createChart (chartData) {
    var ctx = this.chartRef.current.getContext('2d')
    this.chart = new Chart(ctx, chartData)
    this.chart.update()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.reportDefinition && nextProps.report) {
      const chartProps = nextProps.reportDefinition.uiDefinition[0]
      const chartDefinition = this.getChartDefinition(chartProps.chart, chartProps.dataModifiers, nextProps.report)
      this.createChart(chartDefinition)
    }
  }

  getChartDefinition (rawChartDefinition, dataModifiers, chartData) {
    // First, sort the report data
    const sortedData = chartData.sort((a, b) => {
      const multiplier = (dataModifiers.sortOrder === 'ascending') ? 1.0 : -1.0
      return (a[dataModifiers.sortBy] - b[dataModifiers.sortBy]) * multiplier
    })
    // Then fill in the series values
    rawChartDefinition.data.datasets.forEach(dataset => {
      dataset.data = sortedData.map(item => item[dataset.propertyName])
    })
    return rawChartDefinition
  }

  componentWillUnmount () {
    this.props.clearOutput()
  }
}

NetworkAnalysisOutput.propTypes = {
  planId: PropTypes.number,
  reportMetaData: PropTypes.object,
  reportDefinition: PropTypes.object,
  report: PropTypes.array
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  reportMetaData: state.optimization.networkAnalysis.reportMetaData,
  reportDefinition: state.optimization.networkAnalysis.reportDefinition,
  report: state.optimization.networkAnalysis.report
})

const mapDispatchToProps = dispatch => ({
  loadReport: planId => dispatch(NetworkAnalysisActions.loadReport(planId)),
  clearOutput: () => dispatch(NetworkAnalysisActions.clearOutput())
})

const NetworkAnalysisOutputComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisOutput, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisOutputComponent
