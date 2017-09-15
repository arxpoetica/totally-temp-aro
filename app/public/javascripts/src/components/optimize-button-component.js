class OptimizeButtonController {
  constructor(state, regions) {
    this.state = state
    this.regions = regions
    this.selectedRegions = []

    this.areInputsComplete = true
    this.plan = null
    state.plan.subscribe((newPlan) => {
      this.plan = newPlan;
      if (this.plan) this.plan.optimizationState='STARTED'
    })
    this.progressMessage = "01:46"
    this.progressPercent = 2
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
    <!-- Show the "Run" button only if the current plan is in START_STATE or INITIALIZED state -->
    <button ng-if="$ctrl.plan.optimizationState === 'START_STATE' || $ctrl.plan.optimizationState === 'INITIALIZED'"
            ng-class="{ 'btn btn-block': true, 'btn-default': !$ctrl.areInputsComplete, 'btn-primary': $ctrl.areInputsComplete }"
            ng-click="$ctrl.optimizeSelectedNetworkAnalysisType()">
      <i class="fa fa-bolt"></i> Run
    </button>

    <!-- Show the progress bar only if the current plan is in STARTED state -->
    <div ng-if="$ctrl.plan.optimizationState === 'STARTED'"
         class="progress"
         style="height: 34px">
      <div class="progress-bar progress-bar-optimization"
           role="progressbar"
           aria-valuenow="$ctrl.progressPercent"
           aria-valuemin="0"
           aria-valuemax="100"
           ng-style="{ 'line-height': '34px', width: $ctrl.progressPercent + '%' }">
      </div>
    </div>
    <!-- A div overlaid on top of the progress bar, so we can always see the text. Lot of custom css! -->
    <div ng-if="$ctrl.plan.optimizationState === 'STARTED'"
         style="position:relative; top:-47px; background-color: rgba(0, 0, 0, 0.4); color: white; width: 60px; text-align: center; border-radius: 3px; margin: auto; font-weight: bold">
      {{$ctrl.progressMessage}}
    </div>
  `,
  bindings: {},
  controller: OptimizeButtonController
})