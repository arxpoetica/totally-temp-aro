class RoicReportsController {

  constructor($http, state) {
    this.$http = $http
    this.state = state

    this.series = ['Series A', 'Series B'];
    this.options = {
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            id: 'yAxis',
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              callback: (value, index, values) => {
                // This function will format the Y-axis tick values so that we show '100 K' instead of '100000'
                // (and will do the same for millions/billions). We can also specify a tick prefix like '$'
                const maxValue = Math.max.apply(Math, values) // Inefficient to do this every time, but 'values' length will be small
                const thresholds = [
                  { zeroes: 9, suffix: 'B' },   // Billions
                  { zeroes: 6, suffix: 'M' },   // Millions
                  { zeroes: 3, suffix: 'K' }    // Thousands
                ]
                const threshold = thresholds.filter(item => maxValue >= Math.pow(10, item.zeroes))[0]
                if (threshold) {
                  return `${this.selectedCalcType.tickPrefix}${(value / Math.pow(10, threshold.zeroes)).toFixed(1)} ${threshold.suffix}`
                } else {
                  return `${this.selectedCalcType.tickPrefix}${value.toFixed(2)}` // For values less than 1000
                }
              }
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
      { id: 'opex_expenses', description: 'Operating Expenses', tickPrefix: '$ ' },
      { id: 'arpu_curve', description: 'ARPU Curve', tickPrefix: '$ ' },
      { id: 'premises', description: 'Premises', tickPrefix: '' },
      { id: 'customers', description: 'Customers', tickPrefix: '' },
      { id: 'cashFlow', description: 'Cash Flow', tickPrefix: '$ ' },
      { id: 'penetration', description: 'Penetration', tickPrefix: '' },
      { id: 'new_connections_cost', description: 'Cost of new connections', tickPrefix: '$ ' },
      { id: 'new_connections', description: 'Number of new connections', tickPrefix: '' },
      { id: 'revenue', description: 'Revenue', tickPrefix: '$ ' },
      { id: 'maintenance_expenses', description: 'Maintenance Expenses', tickPrefix: '$ ' }
    ]
    this.selectedCalcType = this.calcTypes[0]
  }

  $onInit() {
    this.refreshData()
  }

  $onChanges(changesObj) {
    if (changesObj.planId) {
      this.refreshData()
    }
  }

  refreshData() {
    if (!this.planId) {
      console.error('Plan ID not available in ROIC Reports component')
      return
    }

    const currentYear = (new Date()).getFullYear()
    this.xAxisLabels = []
    for (var i = 0; i < this.state.configuration.optimizationOptions.financialConstraints.years; ++i) {
      this.xAxisLabels.push(currentYear + i)
    }
    this.$http.get(`/service/report/plan/${this.planId}`)
      .then(result => this.roicResults = result.data)
      .catch(err => console.error(err))
  }
}

RoicReportsController.$inject = ['$http', 'state']

let roicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports.html',
  bindings: {
    planId: '<'
  },
  controller: RoicReportsController
}

export default roicReports
