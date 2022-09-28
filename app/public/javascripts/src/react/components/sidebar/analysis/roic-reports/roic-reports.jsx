import React, { Component } from 'react'
import { connect } from 'react-redux'
import RoicReportsSmall from './roic-reports-small.jsx'
import RoicReportsLarge from './roic-reports-large.jsx'
import RoicReportsActions from './roic-reports-actions'

export class RoicReports extends Component {
  constructor (props) {
    super(props)

    this.dataSetProps = {
      fill: false,
      pointBackgroundColor: '#97bbcd',
      pointHoverBackgroundColor: '#000000'
    }

    this.calcTypes = [
      { id: 'opex_expenses', description: 'Operating Expenses', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'arpu_curve', description: 'ARPU Curve', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'premises', description: 'Premises', tickPrefix: '', tickSuffix: '', multiplier: 1.0 },
      { id: 'customers', description: 'Customers', tickPrefix: '', tickSuffix: '', multiplier: 1.0 },
      { id: 'cashFlow', description: 'Cash Flow', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'penetration', description: 'Penetration', tickPrefix: '', tickSuffix: ' %', multiplier: 100.0 },
      { id: 'new_connections_cost', description: 'Cost of new connections', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'new_connections', description: 'Number of new connections', tickPrefix: '', tickSuffix: '', multiplier: 1.0 },
      { id: 'revenue', description: 'Revenue', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'maintenance_expenses', description: 'Maintenance Expenses', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'customer_penetration', description: 'Customer Penetration', tickPrefix: '', tickSuffix: ' %', multiplier: 100.0 },
      { id: 'tam_curve', description: 'Total Addressable Market', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 },
      { id: 'build_cost', description: 'Build Cost', tickPrefix: '$ ', tickSuffix: '', multiplier: 1.0 }
    ]

    this.xAxisLabels = []
    this.categories = [
      {
        id: 'summary',
        description: 'Summary'
      },
      {
        id: 'premises',
        description: 'Premises',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'premises')[0],
          this.calcTypes.filter(item => item.id === 'tam_curve')[0]
        ]
      },
      {
        id: 'subscribers',
        description: 'Subscribers',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'customer_penetration')[0],
          this.calcTypes.filter(item => item.id === 'customers')[0]
        ]
      },
      {
        id: 'revenue',
        description: 'Revenue',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'arpu_curve')[0],
          this.calcTypes.filter(item => item.id === 'penetration')[0],
          this.calcTypes.filter(item => item.id === 'revenue')[0]
        ]
      },
      {
        id: 'opex',
        description: 'Opex',
        calcTypes: [this.calcTypes.filter(item => item.id === 'opex_expenses')[0]]
      },
      {
        id: 'capex',
        description: 'Capex',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'build_cost')[0],
          this.calcTypes.filter(item => item.id === 'maintenance_expenses')[0],
          this.calcTypes.filter(item => item.id === 'new_connections')[0],
          this.calcTypes.filter(item => item.id === 'new_connections_cost')[0]]
      },
      {
        id: 'cashFlow',
        description: 'Cash Flow',
        calcTypes: [this.calcTypes.filter(item => item.id === 'cashFlow')[0]]
      }
    ]

    this.graphOptions = {}
    this.calcTypes.forEach(calcType => this.graphOptions[calcType.id] = this.getOptionsForCalcType(calcType))

    this.networkTypes = [
      { id: 'planned_network', description: 'Planned Network' },
      { id: 'bau_plan', description: 'BAU + Plan' },
      { id: 'incremental', description: 'Incremental' }
    ]

    this.entityTypes = [
      { id: 'network', description: 'All' },
      { id: 'small', description: 'Small Businesses' },
      { id: 'medium', description: 'Medium Businesses' },
      { id: 'large', description: 'Large Businesses' },
      { id: 'household', description: 'Households' },
      { id: 'celltower', description: 'Cell Towers' }
    ]

    this.state = {
    }
  }

  getOptionsForCalcType (calcType) {
    return {
      // What is this? The chart binding is doing an "angular.equals()" comparison,
      // so without a unique ID it will not recompute axes labels, etc.
      id: Math.random(),
      maintainAspectRatio: false,
      aspectRatio: 0.7,
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => this.formatYAxisValue(+tooltipItem.yLabel, [+tooltipItem.yLabel], calcType, 3)
        }
      },
      legend: {
        display: false
      },
      scales: {
        yAxes: [
          {
            id: 'yAxis',
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              beginAtZero: true,
              callback: (value, index, values) => this.formatYAxisValue(value, values, calcType)
            }
          }
        ]
      },
      title: {
        display: true,
        text: calcType.description
      }
    }
  }

  formatYAxisValue (value, allValues, calcType, precision) {
    precision = precision || 1
    // This function will format the Y-axis tick values so that we show '100 K' instead of '100000'
    // (and will do the same for millions/billions). We can also specify a tick prefix like '$'

    // Inefficient to do this every time, but 'values' length will be small
    const maxValue = Math.max.apply(Math, allValues)
    const thresholds = [
      { zeroes: 9, suffix: 'B' }, // Billions
      { zeroes: 6, suffix: 'M' }, // Millions
      { zeroes: 3, suffix: 'K' } // Thousands
    ]
    const threshold = thresholds.filter(item => maxValue >= Math.pow(10, item.zeroes))[0]
    // Two spaces in front of the return value - For some reason values with yMax = 900,000 were getting
    // chopped off on the graph without these two spaces.
    if (threshold) {
      return `  ${calcType.tickPrefix}${(value / Math.pow(10, threshold.zeroes)).toFixed(precision)} ${threshold.suffix}${calcType.tickSuffix}`
    } else {
      return `  ${calcType.tickPrefix}${value.toFixed(precision)}${calcType.tickSuffix}` // For values less than 1000
    }
  }

  componentDidMount() {
    if (Object.entries(this.props.roicResults.roicAnalysis.components).length > 0) {
      this.digestData();
    }
  }

  componentDidUpdate (prevProps) {
    if (
      JSON.stringify(this.props.roicResults) !== JSON.stringify(prevProps.roicResults)
      && Object.entries(this.props.roicResults.roicAnalysis.components).length > 0
    ) {
      this.digestData()
    }
  }

  digestData () {
    const currentYear = (new Date()).getFullYear()
    // number of years is number of vals in each curve, just grab the first one and get the length
    // roicAnalysis.components['BAU'].['network.new_connections_cost'].values
    const aComponentKey = Object.keys(this.props.roicResults.roicAnalysis.components)[0]
    const component = this.props.roicResults.roicAnalysis.components[aComponentKey]
    const aCurveKey = Object.keys(component)[0]
    const yearsCount = aCurveKey !== undefined ? component[aCurveKey].values.length : 0

    const xAxisLabels = []
    for (let i = 0; i < yearsCount; ++i) {
      xAxisLabels.push(currentYear + i)
    }

    this.props.setXaxisLabels(xAxisLabels)
    // Some of the values have to be scaled (e.g. penetration should be in %)
    Object.keys(this.props.roicResults.roicAnalysis.components).forEach(componentKey => {
      const component = this.props.roicResults.roicAnalysis.components[componentKey]
      Object.keys(component).forEach(curveKey => {
        const curve = component[curveKey]
        const calcType = this.calcTypes.find(item => item.id === curve.calcType)
        const multiplier = calcType ? calcType.multiplier : 1.0
        if (!curve.scaled) {
          curve.values = curve.values.map(item => item * multiplier)
          curve.scaled = true
        }
      })
    })
  }

  render () {
    return this.props.roicResults === null ? null : this.renderRoicReports()
  }

  renderRoicReports () {

    const { reportSize, xAxisLabels } = this.props

    return (
      <>
        {reportSize === 'large' &&
          <RoicReportsLarge
            categories={this.categories}
            entityTypes={this.entityTypes}
            networkTypes={this.networkTypes}
            calcTypes={this.calcTypes}
            timeLabels={xAxisLabels}
            dataSetProps={this.dataSetProps}
            graphOptions={this.graphOptions}
            planId={this.props.planId}
          />
        }

        {reportSize === 'small' &&
          <RoicReportsSmall
            categories={this.categories}
            entityTypes={this.entityTypes}
            networkTypes={this.networkTypes}
            calcTypes={this.calcTypes}
            timeLabels={xAxisLabels}
            dataSetProps={this.dataSetProps}
            graphOptions={this.graphOptions}
            planId={this.props.planId}
          />
        }
      </>
    )
  }
}

const mapStateToProps = (state) => ({
  roicResults: state.roicReports.roicResults,
  xAxisLabels: state.roicReports.xAxisLabels,
})

const mapDispatchToProps = (dispatch) => ({
  setXaxisLabels: (xAxisLabels) => dispatch(RoicReportsActions.setXaxisLabels(xAxisLabels)),
})

const RoicReportsComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReports)
export default RoicReportsComponent
