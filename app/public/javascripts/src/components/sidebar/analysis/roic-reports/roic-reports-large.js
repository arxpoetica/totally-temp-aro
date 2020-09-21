class RoicReportsLargeController {
  constructor (state, $timeout) {
    this.state = state
    this.FIBER_STRINGS = this.state.enumStrings['com.altvil.aro.service.entity']['FiberType']
    this.CABLE_CONSTRUCTION_STRINGS = this.state.enumStrings['com.altvil.interfaces']['CableConstructionEnum']
    this.$timeout = $timeout
    this.series = ['Series A', 'Series B']
    this.config = config // Ugh - A global from a time long ago!
    this.shouldRenderCharts = false
  }

  $onInit () {
    this.selectCategory(this.categories[0])
    this.selectedEntityType = this.entityTypes.filter(item => item.id === 'medium')[0]
    this.selectedNetworkType = this.networkTypes.filter(item => item.id === 'planned_network')[0]
  }

  selectCategory (category) {
    this.selectedCategory = category
    // Whats the deal with "shouldRenderCharts"? For cases where we have multiple charts in one tab, the
    // charts sometimes initialize before the HTML flexbox layouts are completed. This leads to charts
    // overlapping one another. We are using a timeout so that the browser will finish laying out the divs,
    // and then initialize charts correctly. This is hacky, if there is a better solution feel free to implement it.
    const RENDER_TIMEOUT_CHARTS = 50 // milliseconds
    this.shouldRenderCharts = false
    this.$timeout(() => this.shouldRenderCharts = true, RENDER_TIMEOUT_CHARTS)
  }
}

RoicReportsLargeController.$inject = ['state', '$timeout']

let roicReportsLarge = {
  templateUrl: '/components/sidebar/analysis/roic-reports/roic-reports-large.html',
  bindings: {
    categories: '<',
    calcTypes: '<',
    networkTypes: '<',
    entityTypes: '<',
    roicResults: '<',
    timeLabels: '<',
    datasetOverride: '<',
    graphOptions: '<'
  },
  controller: RoicReportsLargeController
}

export default roicReportsLarge
