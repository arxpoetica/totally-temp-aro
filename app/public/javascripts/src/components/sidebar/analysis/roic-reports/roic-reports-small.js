class RoicReportsSmallController {

  constructor() {
    this.series = ['Series A', 'Series B'];
  }

  $onInit() {
    this.selectedEntityType = this.entityTypes.filter(item => item.id === 'medium')[0]  // Because "medium" is the only thing supported in service right now
    this.selectedNetworkType = this.networkTypes[0]
    this.selectedCalcType = this.calcTypes[0]
  }
}

let roicReportsSmall = {
  templateUrl: '/components/sidebar/analysis/roic-reports/roic-reports-small.html',
  bindings: {
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
