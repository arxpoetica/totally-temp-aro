import Constants from '../../../common/constants'

class RoicReportsController {

  constructor($http, state) {
    this.$http = $http
    this.state = state

    this.series = ['Series A', 'Series B'];
    this.datasetOverride = { fill: false }
    this.roicResults = null

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
          this.calcTypes.filter(item => item.id === 'tam_curve')[0]],
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'subscribers',
        description: 'Subscribers',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'customer_penetration')[0],
          this.calcTypes.filter(item => item.id === 'customers')[0]],
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'revenue',
        description: 'Revenue',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'arpu_curve')[0],
          this.calcTypes.filter(item => item.id === 'penetration')[0],
          this.calcTypes.filter(item => item.id === 'revenue')[0]
        ],
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'opex',
        description: 'Opex',
        calcTypes: [this.calcTypes.filter(item => item.id === 'opex_expenses')[0]],
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'capex',
        description: 'Capex',
        calcTypes: [
          this.calcTypes.filter(item => item.id === 'build_cost')[0],
          this.calcTypes.filter(item => item.id === 'maintenance_expenses')[0],
          this.calcTypes.filter(item => item.id === 'new_connections')[0],
          this.calcTypes.filter(item => item.id === 'new_connections_cost')[0]],
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      },
      {
        id: 'cashFlow',
        description: 'Cash Flow',
        calcTypes: [this.calcTypes.filter(item => item.id === 'cashFlow')[0]],
        networkTypes: ['new_network'],
        selectedNetworkType: 'new_network'
      }
    ]
    this.graphOptions = {}
    this.calcTypes.forEach(calcType => this.graphOptions[calcType.id] = this.getOptionsForCalcType(calcType))
    this.networkTypes = [
      { id: 'new_network', description: 'New Network' },
      { id: 'planned_network', description: 'Planned Network' },
      { id: 'bau', description: 'BAU' },
      { id: 'bau_intersects', description: 'BAU Intersection' },
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
  }

  getOptionsForCalcType(calcType) {
    return {
      maintainAspectRatio: false,
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => this.formatYAxisValue(+tooltipItem.yLabel, [+tooltipItem.yLabel], calcType, 3)
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
              callback: (value, index, values) => this.formatYAxisValue(value, values, calcType)
            }
          }
        ]
      }
    }
  }

  $onChanges(changesObj) {

    if (changesObj.planId || changesObj.optimizationState) {
      this.refreshData()
    }
  }

  formatYAxisValue(value, allValues, calcType, precision) {
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
      return `  ${calcType.tickPrefix}${(value / Math.pow(10, threshold.zeroes)).toFixed(precision)} ${threshold.suffix}${calcType.tickSuffix}`
    } else {
      return `  ${calcType.tickPrefix}${value.toFixed(precision)}${calcType.tickSuffix}` // For values less than 1000
    }
  }

  refreshData() {
    if (!this.isLocation && !this.planId) {
      console.error('Plan ID not available in ROIC Reports component')
      return
    }
    const currentYear = (new Date()).getFullYear()
    this.xAxisLabels = []
    var optimizationBody = this.state.getOptimizationBody()
    for (var i = 0; i < optimizationBody.financialConstraints.years; ++i) {
      this.xAxisLabels.push(currentYear + i)
    }
    this.loadROICResultsForPlan(this.planId)
  }

  loadROICResultsForPlan(planId) {
    // for testing
    // need to generalize this, tie it to this.roicResults.roicAnalysis in the parent
    
    if(this.isLocation){
      var userId = 2
      var planSettings = {
        "analysis_type": "LOCATION_ROIC",
        "locationIds": [
          "5d7be43e-798c-11e8-b1ab-c772e0f1635c"
        ],
        "planId": 617,
        "projectTemplateId": 1
      }
      
      this.$http.post(`/service/location-analysis/roic?userId=${userId}`, planSettings)
      .then(result => {
        console.log(result.data)
        this.roicResults = {}
        this.roicResults.roicAnalysis = result.data
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
    
    }else{
    
      this.$http.get(`/service/report/plan/${planId}`)
      .then(result => {
        console.log(result.data)
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
}

RoicReportsController.$inject = ['$http', 'state']

let roicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports/roic-reports.html',
  bindings: {
    planId: '<',
    optimizationState: '<',
    reportSize: '<', 
    isLocation: '<'
  },
  controller: RoicReportsController
}

export default roicReports
