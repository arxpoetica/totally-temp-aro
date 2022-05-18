import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import Chart from 'chart.js'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import ReportsDownloadModal from '../reports/reports-download-modal.jsx'
import NetworkAnalysisActions from './network-analysis-actions'
import ReportActions from '../reports/reports-actions'
import PlanStates from '../../plan/plan-states'
import deepmerge from 'deepmerge'


export class NetworkAnalysisOutput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedCapitalType: null,
      selectedChartType: null
    }
    this.props.loadReport(this.props.planId)
    this.chartRef = React.createRef()
  }

  componentDidUpdate() {
    if (this.props.chartReportDefinition && !this.state.selectedChartType && !this.state.selectedCapitalType) {
      this.setState({
        selectedChartType: this.props.chartReportDefinition.uiDefinition.chartType[0].chartDefinition.name,
        selectedCapitalType: this.props.chartReportDefinition.uiDefinition.capitalType[0].dataModifiers.labelProperty
      })
    }
  }

  render () {
    const hasChartData = Boolean(this.props.chartReportDefinition && this.props.chartReport && this.props.chartReport.length > 0)
    if (hasChartData) {
      // Why setTimeout()? We need the chart to be rendered with the right display style, THEN we create the chart.
      if (this.state.selectedCapitalType && this.state.selectedChartType) {
        this.updateChartDefinition()
        setTimeout(() => this.updateChart(), 0)
      }
    } else {
      // Someone may have clicked the 'Modify' button to re-run analysis. Clear old chart (if any)
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    }
    return <div>

      <div className="row p-3" style={{ display: hasChartData ? 'flex' : 'none' }}>
        <div className="col-md-4">
          <label style={{ lineHeight: '36px' }}>Capital Type</label>
        </div>
        <div className="col-md-8">
          <select
            className="form-control"
            value={this.state.selectedCapitalType ? this.state.selectedCapitalType.name : ''}
            onChange={event => this.setState({ selectedCapitalType: event.target.value })}
          >
            {this.props.chartReportDefinition
              ? this.props.chartReportDefinition.uiDefinition.capitalType.map(chart => (
                <option key={chart.chartDefinition.displayName} value={chart.dataModifiers.labelProperty}>
                  {chart.chartDefinition.displayName}
                </option>
              ))
              : null}
          </select>
        </div>
      </div>

      <div className="row pl-3 pr-3 pb-3" style={{ display: hasChartData ? 'flex' : 'none' }}>
        <div className="col-md-4">
          <label style={{ lineHeight: '36px' }}>Chart Type</label>
        </div>
        <div className="col-md-8">
          <select
            className="form-control"
            value={this.state.selectedChartType ? this.state.selectedChartType.name : ''}
            onChange={event => this.setState({ selectedChartType: event.target.value })}
          >
            {this.props.chartReportDefinition
              ? this.props.chartReportDefinition.uiDefinition.chartType.map(chart => (
                <option key={chart.chartDefinition.name} value={chart.chartDefinition.name}>{chart.chartDefinition.displayName}</option>
              ))
              : null}
          </select>
        </div>
      </div>

      <canvas ref={this.chartRef} style={{ display: hasChartData ? 'block' : 'none' }} />

      <div className='alert alert-warning mt-3' style={{ display: hasChartData ? 'none' : 'block' }}>
        Network analysis data not available. Run a new network analysis to see results.
      </div>
      <button className='btn btn-primary pull-left' onClick={() => this.props.showOrHideReportModal(true)}>Reports</button>
      <ReportsDownloadModal reportTypes={['NETWORK_ANALYSIS']} />
    </div>
  }

  componentWillReceiveProps (nextProps) {
    // If the plan state changes (e.g. when optimization is finished), either clear the old report or load the new one
    if (this.props.activePlanState !== nextProps.activePlanState &&
        nextProps.activePlanState === PlanStates.START_STATE) {
      this.props.clearOutput() // not sure this belongs here
    }
  }

  updateChartDefinition () {
    if (!this.props.chartReportDefinition) {
      // This can happen when updateChart() is called from a setTimeout(),
      // and the properties change in the meantime
      return
    }
    var selectedUiDefinition = null
    if (!this.state.selectedCapitalType || !this.state.selectedChartType) {
      selectedUiDefinition = deepmerge(
        this.props.chartReportDefinition.uiDefinition.chartType[0],
        this.props.chartReportDefinition.uiDefinition.capitalType[0]
      )
    } else {
      const selectedChartType = this.props.chartReportDefinition.uiDefinition.chartType.find(item => {
        return item.chartDefinition.name === this.state.selectedChartType
      })
      const selectedCapitalType = this.props.chartReportDefinition.uiDefinition.capitalType.find(item => {
        return item.dataModifiers.labelProperty === this.state.selectedCapitalType
      })
      selectedUiDefinition = deepmerge(selectedChartType, selectedCapitalType)
    }
    const { chartDefinition, dataModifiers } = JSON.parse(JSON.stringify(selectedUiDefinition))
    this.chartDefinition = this.buildChartDefinition(chartDefinition, dataModifiers, this.props.chartReport)
  }

  updateChart () {
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
    var ctx = this.chartRef.current.getContext('2d')
    this.chart = new Chart(ctx, this.chartDefinition)
  }

  buildChartDefinition (rawChartDefinition, dataModifiers, chartData) {
    const { name } = rawChartDefinition

    // BIG HONKIN' NOTE:
    // This filter code was made at the behest of Sir Adam W. Musial of New York fame.
    // Essentially upward outlier IIR(-only) data above the 200% threshold is "not needed"
    // for presentation. THIS CHANGE SHOULD ARGUABLY EXIST AT THE SERVICE LAYER.
    // But since the user can still download ALL data changes, this is a
    // "presentational bandaid" -- only for the sake of filtering out data that
    // end users will need. If the request is ever made to fix this again, we
    // should discuss it at a service level, and not a presentation level.
    // Sincerely, Robert ⚔️ Excalibur ⚔️ Hall
    const filteredData = name.match(/^irr/)
      ? chartData.filter(datum => datum[name] < 2)
      : chartData

    // next, sort the report data
    const sortedData = filteredData.sort((a, b) => {
      const multiplier = (dataModifiers.sortOrder === 'ascending') ? 1.0 : -1.0
      return (a[dataModifiers.sortBy] - b[dataModifiers.sortBy]) * multiplier
    })
    this.populateSeriesValues(sortedData, rawChartDefinition, dataModifiers)
    this.populateAxesOptions(sortedData, rawChartDefinition, dataModifiers)
    this.populateTooltipOptions(rawChartDefinition, dataModifiers)
    return rawChartDefinition
  }

  // Populate a raw chart definition with series values
  populateSeriesValues (sortedData, rawChartDefinition, dataModifiers) {
    const xAxisValues = sortedData.map(item => item[dataModifiers.labelProperty])
    const tickFormat = dataModifiers[rawChartDefinition.name].tickFormat

    // Populate all datasets
    rawChartDefinition.data.datasets.forEach(dataset => {
      dataset.data = sortedData.map((item, index) => {
        // For scatter charts, return an object of the form { x: <value>, y: <value> }, otherwise just return the values
        const y = item[dataset.propertyName] * tickFormat.multiplier
        return (rawChartDefinition.type === 'scatter')
          ? { x: xAxisValues[index], y: y }
          : y
      })
    })
  }

  // Populate the options object to display axes
  populateAxesOptions (sortedData, rawChartDefinition, dataModifiers) {
    const xAxisValues = sortedData.map(item => item[dataModifiers.labelProperty])
    const tickFormat = dataModifiers[rawChartDefinition.name].tickFormat

    // Apply formatting on all y axes
    rawChartDefinition.options.scales.yAxes.forEach(yAxis => {
      yAxis.ticks.callback = (value, index, values) => this.formatAxisValue(value, values,
        tickFormat.prefix || '', tickFormat.suffix || '', tickFormat.precision || 1)
    })

    // Apply formatting on x axis
    const xTickFormat = dataModifiers[dataModifiers.labelProperty].tickFormat
    if (rawChartDefinition.type !== 'scatter') {
      // For scatter charts, we need to set the "data.labels" array
      rawChartDefinition.data.labels = xAxisValues.map(item => this.formatAxisValue(item, xAxisValues, xTickFormat.prefix || '',
        xTickFormat.suffix || '', xTickFormat.precision || 1))
    } else {
      // For all other charts, set the "options.scales.xAxes"
      rawChartDefinition.options.scales.xAxes.forEach(xAxis => {
        xAxis.ticks.userCallback = (value, index, values) => this.formatAxisValue(value, values,
          xTickFormat.prefix || '', xTickFormat.suffix || '', xTickFormat.precision || 1)
      })
    }
  }

  // Populate the options for showing tooltips when a user hovers over a data point
  populateTooltipOptions (rawChartDefinition, dataModifiers) {
    rawChartDefinition.options.tooltips.callbacks.label = (tooltipItem, data) => {
      var allXValues = []
      var allYValues = []
      data.datasets.forEach(dataset => { allXValues = allXValues.concat(dataset.data.map((item, index) => item.x || index)) })
      data.datasets.forEach(dataset => { allYValues = allYValues.concat(dataset.data.map(item => item.y || item)) })
      const xTickFormat = dataModifiers[dataModifiers.labelProperty].tickFormat
      const yTickFormat = dataModifiers[rawChartDefinition.name].tickFormat
      const labelLine1 = `${dataModifiers.labelProperty}: ${this.formatAxisValue(+tooltipItem.label, allXValues, xTickFormat.prefix || '', xTickFormat.suffix || '', xTickFormat.precision || 1)}`
      const labelLine2 = `${rawChartDefinition.displayName}: ${this.formatAxisValue(+tooltipItem.value, allYValues, yTickFormat.prefix || '', yTickFormat.suffix || '', yTickFormat.precision || 1)}`
      return [labelLine1, labelLine2]
    }
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
  isTesting: PropTypes.bool,
  planId: PropTypes.number,
  chartReportMetaData: PropTypes.object,
  chartReportDefinition: PropTypes.object,
  chartReport: PropTypes.array
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan.id,
  activePlanState: state.plan.activePlan.planState,
  chartReportMetaData: state.optimization.networkAnalysis.chartReportMetaData,
  chartReportDefinition: state.optimization.networkAnalysis.chartReportDefinition,
  chartReport: state.optimization.networkAnalysis.chartReport
})

const mapDispatchToProps = dispatch => ({
  loadReport: planId => dispatch(NetworkAnalysisActions.loadReport(planId)),
  clearOutput: () => dispatch(ReportActions.clearOutput()),
  showOrHideReportModal: showReportModal => dispatch(ReportActions.showOrHideReportModal(showReportModal))
})

const NetworkAnalysisOutputComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisOutput, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisOutputComponent
