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

    this.categories = [
      {
        id: 'summary',
        description: 'Summary'
      },
      {
        id: 'premises',
        description: 'Premises',
        metrics: ['premises', 'tam_curve'],
        selectedMetric: 'premises',
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'subscribers',
        description: 'Subscribers',
        metrics: ['customer_penetration', 'customers'],
        selectedMetric: 'customer_penetration',
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'revenue',
        description: 'Revenue',
        metrics: ['arpu_curve', 'penetration', 'revenue'],
        selectedMetric: 'arpu_curve',
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'opex',
        description: 'Opex',
        metrics: ['opex_expenses'],
        selectedMetric: 'opex_expenses',
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'capex',
        description: 'Capex',
        metrics: ['build_cost', 'maintenance_expenses', 'new_connections', 'new_connections_cost'],
        selectedMetric: 'build_cost',
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'cashFlow',
        description: 'Cash Flow',
        metrics: ['cashFlow'],
        selectedMetric: 'cashFlow',
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      }
    ]
    this.selectCategory(this.categories[1])

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
    this.selectedCalcType = this.state.calcTypes[0]
  }

  selectCategory(category) {
    this.selectedCategory = category
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
    this.state.loadROICResultsForPlan(this.planId)
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
