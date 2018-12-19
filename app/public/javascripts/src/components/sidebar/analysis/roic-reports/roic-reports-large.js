class RoicReportsLargeController {

  constructor() {
    this.series = ['Series A', 'Series B'];
    this.config = config  // Ugh - A global from a time long ago!
  }

  $onInit() {
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
    this.selectCategory(this.categories[0])
    this.selectedEntityType = this.entityTypes.filter(item => item.id === 'medium')[0]
  }

  selectCategory(category) {
    this.selectedCategory = category
  }
}

let roicReportsLarge = {
  templateUrl: '/components/sidebar/analysis/roic-reports/roic-reports-large.html',
  bindings: {
    calcTypes: '<',
    entityTypes: '<',
    roicResults: '<',
    timeLabels: '<',
    datasetOverride: '<',
    graphOptions: '<'
  },
  controller: RoicReportsLargeController
}

export default roicReportsLarge
