import Constants from '../../common/constants'

class RoicReportsController {

  constructor($http, state) {
    this.$http = $http
    this.state = state

    this.series = ['Series A', 'Series B'];
    this.options = {
      maintainAspectRatio: false,
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => this.formatYAxisValue(+tooltipItem.yLabel, [+tooltipItem.yLabel], 3)
        }
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
              callback: (value, index, values) => this.formatYAxisValue(value, values)
            }
          }
        ]
      }
    }
    this.datasetOverride = { fill: false }

    this.networkTypes = [
      { id: 'new_network', description: 'New Network' },
      { id: 'planned_network', description: 'Planned Network' },
      { id: 'bau', description: 'BAU' },
      { id: 'bau_intersects', description: 'BAU Intersection' },
      { id: 'bau_plan', description: 'BAU + Plan' },
      { id: 'incremental', description: 'Incremental' }
    ]
    this.selectedNetworkType = this.networkTypes[0]

    this.entityTypes = [
      { id: 'network', description: 'All' },
      { id: 'small', description: 'Small Businesses' },
      { id: 'medium', description: 'Medium Businesses' },
      { id: 'large', description: 'Large Businesses' },
      { id: 'household', description: 'Households' },
      { id: 'celltower', description: 'Cell Towers' }
    ]
    this.selectedEntityType = this.entityTypes.filter(item => item.id === 'medium')[0]  // Because "medium" is the only thing supported in service right now

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
    this.selectedCalcType = this.calcTypes[0]
  }

  $onChanges(changesObj) {
    if (changesObj.planId || changesObj.optimizationState) {
      this.refreshData()
    }
  }

  formatYAxisValue(value, allValues, precision) {
    precision = precision || 1
    // This function will format the Y-axis tick values so that we show '100 K' instead of '100000'
    // (and will do the same for millions/billions). We can also specify a tick prefix like '$'
    const maxValue = Math.max.apply(Math, allValues) // Inefficient to do this every time, but 'values' length will be small
    const thresholds = [
      { zeroes: 9, suffix: 'B' },   // Billions
      { zeroes: 6, suffix: 'M' },   // Millions
      { zeroes: 3, suffix: 'K' }    // Thousands
    ]
    const threshold = thresholds.filter(item => maxValue >= Math.pow(10, item.zeroes))[0]
    // Two spaces in front of the return value - For some reason values with yMax = 900,000 were getting chopped off on the graph
    // without these two spaces.
    if (threshold) {
      return `  ${this.selectedCalcType.tickPrefix}${(value / Math.pow(10, threshold.zeroes)).toFixed(precision)} ${threshold.suffix}${this.selectedCalcType.tickSuffix}`
    } else {
      return `  ${this.selectedCalcType.tickPrefix}${value.toFixed(precision)}${this.selectedCalcType.tickSuffix}` // For values less than 1000
    }
  }

  refreshData() {
    if (!this.planId) {
      console.error('Plan ID not available in ROIC Reports component')
      return
    }

    const currentYear = (new Date()).getFullYear()
    this.xAxisLabels = []
    for (var i = 0; i < this.state.getOptimizationBody().financialConstraints.years; ++i) {
      this.xAxisLabels.push(currentYear + i)
    }
    this.$http.get(`/service/report/plan/${this.planId}`)
      .then(result => {
        this.roicResults = result.data
        // Some of the values have to be scaled (e.g. penetration should be in %)
        Object.keys(this.roicResults.roicAnalysis.components).forEach(componentKey => {
          const component = this.roicResults.roicAnalysis.components[componentKey]
          Object.keys(component).forEach(curveKey => {
            const curve = component[curveKey]
            const calcType = this.calcTypes.filter(item => item.id === curve.calcType)[0]
            const multiplier = calcType ? calcType.multiplier : 1.0
            curve.values = curve.values.map(item => item * multiplier)
          })
        })
      })
      .catch(err => console.error(err))
  }
}

RoicReportsController.$inject = ['$http', 'state']

let roicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports.html',
  bindings: {
    planId: '<',
    optimizationState: '<'
  },
  controller: RoicReportsController
}

export default roicReports
