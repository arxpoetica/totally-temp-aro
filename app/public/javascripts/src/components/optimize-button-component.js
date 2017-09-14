class OptimizeButtonController {
  constructor(state, regions) {
    this.state = state
    this.regions = regions
    this.selectedRegions = []
  }

  optimizeSelectedNetworkAnalysisType() {

    if (this.state.optimizationOptions.selectedgeographicalLayer.id === 'SELECTED_AREAS') {
      Object.keys(this.regions.selectedRegions).forEach((key) => {
        var regionObj = regions.selectedRegions[key]
        this.selectedRegions.push({
          id: regionObj.id,
          name: regionObj.name,
          type: regionObj.type,
          layerId: regionObj.layerId
        })
      })
    }

    var optimizationBody = this.state.getOptimizationBody()
    // Check if at least one data source is selected
    var isAnyDataSourceSelected = this.state.selectedDataSources.length > 0
    // A location is selected if the "checked" property is true
    var isAnyLocationTypeSelected = (this.state.locationTypes.getValue().filter((item) => item.checked).length > 0) || (this.state.constructionSites.filter((item) => item.checked).length > 0)
    var validSelection = isAnyDataSourceSelected && isAnyLocationTypeSelected
    if (validSelection) {
      this.canceler = optimization.optimize($scope.plan, optimizationBody, this.selectedRegions)
    } else {
      swal({
        title: 'Incomplete input',
        text: 'Please select one or more locations and data sources before running optimization',
        type: 'error',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Ok',
        closeOnConfirm: true
      })
    }
  }
}

OptimizeButtonController.$inject = ['state', 'regions']

app.component('optimizeButton', {
  template: `
    <button ng-class="{ 'btn btn-default btn-block': true }"
      ng-click="$ctrl.optimizeSelectedNetworkAnalysisType()">
      <i class="fa fa-bolt"></i> Run
    </button>
  `,
  bindings: {},
  controller: OptimizeButtonController
})