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
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'left'
          }
        ]
      }
    }

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
      { id: 'opex_expenses', description: 'Operating Expenses' },
      { id: 'arpu_curve', description: 'ARPU Curve' },
      { id: 'premises', description: 'Premises' },
      { id: 'customers', description: 'Customers' },
      { id: 'cashFlow', description: 'Cash Flow' },
      { id: 'penetration', description: 'Penetration' },
      { id: 'new_connections_cost', description: 'Cost of new connections' },
      { id: 'new_connections', description: 'Number of new connections' },
      { id: 'revenue', description: 'Revenue' },
      { id: 'maintenance_expenses', description: 'Maintenance Expenses' }
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
      .then(result => {
        this.roicResults = result.data
        // A little bit of processing - The components (e.g. roicResults.roicAnalysis.components.NEW_NETWORK) are in the
        // form of an array. We will add roicResults.roicAnalysis.components.NEW_NETWORK_KEYED that will key the array items
        // based on the curveName, so that we can bind to the values easily from our HTML.
        Object.keys(this.roicResults.roicAnalysis.components).forEach(componentKey => {
          this.roicResults.roicAnalysis.components[`${componentKey}_INDEXED`] = {}
          this.roicResults.roicAnalysis.components[componentKey].forEach(component => {
            this.roicResults.roicAnalysis.components[`${componentKey}_INDEXED`][component.curveName] = component
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
    planId: '<'
  },
  controller: RoicReportsController
}

export default roicReports
