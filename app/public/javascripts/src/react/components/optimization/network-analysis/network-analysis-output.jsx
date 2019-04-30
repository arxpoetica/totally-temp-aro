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
      const chartDefinition = this.getChartDefinition(chartProps.chartDefinition, chartProps.dataModifiers, nextProps.report)
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
    const xAxisValues = sortedData.map(item => item[dataModifiers.labels.property])
    const tickFormat = dataModifiers[rawChartDefinition.name].tickFormat
    rawChartDefinition.data.datasets.forEach(dataset => {
      dataset.data = sortedData.map((item, index) => {
        const y = item[dataset.propertyName] * tickFormat.multiplier
        return (rawChartDefinition.type === 'scatter')
          ? { x: xAxisValues[index], y: y }
          : y
      })
    })

    // Then build the chart options
    rawChartDefinition.options.scales.yAxes.forEach(yAxis => {
      yAxis.ticks.callback = (value, index, values) => this.formatAxisValue(value, values,
        tickFormat.prefix || '', tickFormat.suffix || '', tickFormat.precision || 1)
    })
    const xTickFormat = dataModifiers.labels.tickFormat
    if (rawChartDefinition.type !== 'scatter') {
      rawChartDefinition.data.labels = xAxisValues.map(item => this.formatAxisValue(item, xAxisValues, xTickFormat.prefix || '',
        xTickFormat.suffix || '', xTickFormat.precision || 1))
    } else {
      rawChartDefinition.options.scales.xAxes.forEach(xAxis => {
        xAxis.ticks.userCallback = (value, index, values) => this.formatAxisValue(value, values,
          xTickFormat.prefix || '', xTickFormat.suffix || '', xTickFormat.precision || 1)
      })
    }
    return rawChartDefinition
  }

  formatAxisValue (value, allValues, tickPrefix, tickSuffix, precision) {
    // This function will format the Y-axis tick values so that we show '100 K' instead of '100000'
    // (and will do the same for millions/billions). We can also specify a tick prefix like '$'
    const maxValue = Math.max.apply(Math, allValues) // Inefficient to do this every time, but 'values' length will be small
    const thresholds = [
      { zeroes: 9, suffix: 'B' }, // Billions
      { zeroes: 6, suffix: 'M' }, // Millions
      { zeroes: 3, suffix: 'K' } // Thousands
    ]
    const threshold = thresholds.filter(item => maxValue >= Math.pow(10, item.zeroes))[0]
    // Two spaces in front of the return value - For some reason values with yMax = 900,000 were getting chopped off on the graph
    // without these two spaces.
    if (threshold) {
      return `  ${tickPrefix}${(value / Math.pow(10, threshold.zeroes)).toFixed(precision)} ${threshold.suffix}${tickSuffix}`
    } else {
      return `  ${tickPrefix}${value.toFixed(precision)}${tickSuffix}` // For values less than 1000
    }
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
