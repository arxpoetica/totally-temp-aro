class RoicReportsLargeController {

  constructor(state) {
    this.state = state
    this.series = ['Series A', 'Series B'];
    this.config = config  // Ugh - A global from a time long ago!
  }

  $onInit() {
    this.selectCategory(this.categories[0])
    this.selectedEntityType = this.entityTypes.filter(item => item.id === 'medium')[0]
  }

  selectCategory(category) {
    this.selectedCategory = category
  }
}

RoicReportsLargeController.$inject = ['state']

let roicReportsLarge = {
  templateUrl: '/components/sidebar/analysis/roic-reports/roic-reports-large.html',
  bindings: {
    categories: '<',
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
