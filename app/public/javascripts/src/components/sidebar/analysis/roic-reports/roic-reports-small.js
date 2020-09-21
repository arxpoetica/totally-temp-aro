class RoicReportsSmallController {
  constructor (state) {
    this.state = state
    this.FIBER_STRINGS = this.state.enumStrings['com.altvil.aro.service.entity']['FiberType']
    this.CABLE_CONSTRUCTION_STRINGS = this.state.enumStrings['com.altvil.interfaces']['CableConstructionEnum']
    this.series = ['Series A', 'Series B']
    this.config = config // Ugh - A global from a time long ago!
  }

  $onInit () {
    this.selectedEntityType = this.entityTypes.filter(item => item.id === 'network')[0] // Because "medium" is the only thing supported in service right now
    this.selectedNetworkType = this.networkTypes.filter(item => item.id === 'planned_network')[0]
    this.selectCategory(this.categories[1])
    this.selectedCalcType = this.selectedCategory.calcTypes[0]
  }

  selectCategory (category) {
    this.selectedCategory = category
  }

  selectedCategoryChanged () {
    this.selectedCalcType = this.selectedCategory.calcTypes[0]
  }
}

RoicReportsSmallController.$inject = ['state']

let roicReportsSmall = {
  templateUrl: '/components/sidebar/analysis/roic-reports/roic-reports-small.html',
  bindings: {
    categories: '<',
    entityTypes: '<',
    calcTypes: '<',
    networkTypes: '<',
    roicResults: '<',
    timeLabels: '<',
    datasetOverride: '<',
    graphOptions: '<'
  },
  controller: RoicReportsSmallController
}

export default roicReportsSmall
