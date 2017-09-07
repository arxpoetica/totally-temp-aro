class AnalysisModeController {

  constructor($scope,$rootScope,state,optimization,regions) {
    this.state = state
    this.optimization = optimization
    this.canceler = null
    this.$scope = $scope
    this.selectedRegions = []

    $scope.plan = null

    this.accordions = Object.freeze({
      INPUT: 0,
      OUTPUT: 1
    })

    this.expandedAccordionIndex = this.accordions.INPUT

    //listening to plan change need to change to reactivejs observer pattern 
    $rootScope.$on('plan_selected', planChanged)

    function planChanged(e, plan) {
      $scope.plan = plan
      if (!plan) return
    }

    this.optimizeSelectedNetworkAnalysisType = () => {

      if (state.optimizationOptions.selectedgeographicalLayer.id === 'SELECTED_AREAS') {
        Object.keys(regions.selectedRegions).forEach((key) => {
          var regionObj = regions.selectedRegions[key]
          this.selectedRegions.push({
            id: regionObj.id,
            name: regionObj.name,
            type: regionObj.type,
            layerId: regionObj.layerId
          })
        })
      }

      var optimizationBody = state.getOptimizationBody()
      // Check if at least one data source is selected
      var isAnyDataSourceSelected = state.selectedDataSources.length > 0
      // A location is selected if the "checked" property is true
      var isAnyLocationTypeSelected = (state.locationTypes.getValue().filter((item) => item.checked).length > 0) || (state.constructionSites.filter((item) => item.checked).length > 0)
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

  expandAccordion(expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }

}

AnalysisModeController.$inject = ['$scope','$rootScope','state','optimization','regions']

app.component('analysisMode', {
  template: `
    <style>
      .analysis-mode-container {
        position: absolute; /* This will require the parent to have position: relative or absolute */
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .analysis-type {
        flex: 0 0 auto;
      }
      .accordion-title {
        flex: 0 0 auto;
      }
      .accordion-contents {
        flex: 1 1 auto;
        transition: flex-grow 100ms, flex-shrink 100ms, visibility 0ms 100ms;
        overflow: hidden;
        max-height: 500px;
        overflow: auto;
      }
      .accordion-contents.collapsed {
        flex: 0 0 auto;
        height: 0px;
        visibility: hidden;
      }
      .accordion-title {
        background-color: #333;
        color: white;
        font-weight: 700;
        font-size: 18px;
        border-radius: 0px;
      }
      .accordion-title:hover, .accordion-title:focus {
        background-color: #333;
        color: white;
      }
    </style>
    <div class="analysis-mode-container">
      <div class="analysis-type">
        <div class="col-xs-7" style="left: 20%;border: 10px solid white;">
        <select class="form-control"
          ng-model="$ctrl.state.networkAnalysisType"
          ng-options="item as item.label for item in $ctrl.state.networkAnalysisTypes">
        </select>
        </div>
        <button class="btn btn-default btn-block" ng-click="$ctrl.optimizeSelectedNetworkAnalysisType()">
          <i class="fa fa-bolt"></i> Run
        </button>
        <hr></hr>
      </div>
      <div class="accordion-title">
        <button class="btn btn-default btn-block accordion-title" ng-click="$ctrl.expandAccordion($ctrl.accordions.INPUT)">Input</button>
      </div>
      <div ng-class="{ 'accordion-contents': true, 'collapsed': $ctrl.expandedAccordionIndex !== $ctrl.accordions.INPUT }">
        <div ng-show="$ctrl.state.networkAnalysisType.id === 'NETWORK_BUILD'">
          <network-build></network-build>
        </div>
        <div ng-show="$ctrl.state.networkAnalysisType.id === 'NETWORK_ANALYSIS'">
          <network-analysis></network-analysis>
        </div>
      </div>
      <div class="accordion-title">
        <button class="btn btn-default btn-block accordion-title" ng-click="$ctrl.expandAccordion($ctrl.accordions.OUTPUT)">Output</button>
      </div>
      <div ng-class="{ 'accordion-contents': true, 'collapsed': $ctrl.expandedAccordionIndex !== $ctrl.accordions.OUTPUT }">
        content content content content content content content content content content content content content content content content content content
      </div>
    </div>
  `,
  bindings: {},
  controller: AnalysisModeController
})

