class AnalysisModeController {

  constructor($scope,$rootScope,state,optimization) {
    this.state = state
    this.optimization = optimization
    this.canceler = null
    this.$scope = $scope

    $scope.plan = null

    this.accordions = Object.freeze({
      INPUT: 0,
      OUTPUT: 1
    })

    this.expandedAccordionIndex = this.accordions.INPUT

    state.plan
      .subscribe((plan) => {
        this.plan = plan
      })

    this.zoomTarget = (target) => {
      state.requestPanToMap.next({ lat: target.lat, lng: target.lng, zoom:18 })
    }

    this.removeTarget = (target) => {
      $http.post(`/network_plan/${this.plan.id}/removeTargets`, { locationIds: [target.id] })
        .then((response) => {
          this.state.reloadSelectedLocations()
        })
    }

    this.removeServiceArea = (target) => {
      $http.post(`/service_areas/${this.plan.id}/removeServiceAreaTargets`, { serviceAreaIds: [target.id] })
        .then((response) => {
          this.state.reloadSelectedServiceAreas()
        })
    }

    this.validateRunButton = () => {
      // yet to check weather serviceArea/locations are selected or not once service area selection is done
      return state.selectedLocations.getValue().size > 0 ? true : false
    }
  }

  expandAccordion(expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }
}

AnalysisModeController.$inject = ['$scope','$rootScope','state','optimization']

app.component('analysisMode', {
  template: `
    <style>
      .analysis-mode-container {
        position: relative; /* This will require the parent to have position: relative or absolute */
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
        <h4 style="text-align: center;">Analysis Type:{{$ctrl.state.networkAnalysisType.label}}</h4>
        <optimize-button></optimize-button>
      </div>
      <div class="accordion-title">
        <button class="btn btn-default btn-block accordion-title" ng-click="$ctrl.expandAccordion($ctrl.accordions.INPUT)">Input</button>
      </div>
      <div ng-class="{ 'accordion-contents': true, 'collapsed': $ctrl.expandedAccordionIndex !== $ctrl.accordions.INPUT }">
        <div class="col-xs-7" style="left: 20%;border: 10px solid white;">
          <select class="form-control"
            ng-model="$ctrl.state.networkAnalysisType"
            ng-options="item as item.label for item in $ctrl.state.networkAnalysisTypes">
          </select>
        </div>
        <div ng-show="$ctrl.state.networkAnalysisType.id === 'NETWORK_BUILD'">
          <network-build remove-target="$ctrl.removeTarget(target)" zoom-target="$ctrl.zoomTarget(target)" 
            remove-service-area="$ctrl.removeServiceArea(target)"></network-build>
        </div>
        <div ng-show="$ctrl.state.networkAnalysisType.id === 'NETWORK_ANALYSIS'">
          <network-analysis remove-target="$ctrl.removeTarget(target)" zoom-target="$ctrl.zoomTarget(target)"
            remove-service-area="$ctrl.removeServiceArea(target)"></network-analysis>
        </div>
      </div>
      <div class="accordion-title">
        <button class="btn btn-default btn-block accordion-title" ng-click="$ctrl.expandAccordion($ctrl.accordions.OUTPUT)">Output</button>
      </div>
      <div ng-class="{ 'accordion-contents': true, 'collapsed': $ctrl.expandedAccordionIndex !== $ctrl.accordions.OUTPUT }">
        <div ng-show="$ctrl.state.networkAnalysisType.id === 'NETWORK_ANALYSIS'">
          <network-analysis-output></network-analysis-output>
        </div>
      </div>
    </div>
  `,
  bindings: {},
  controller: AnalysisModeController
})

