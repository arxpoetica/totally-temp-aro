class AnalysisModeController {

  constructor(state) {
    this.state = state

    this.accordions = Object.freeze({
      INPUT: 0,
      OUTPUT: 1
    })

    this.expandedAccordionIndex = this.accordions.INPUT
  }

  expandAccordion(expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }

}

AnalysisModeController.$inject = ['state']

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
        <button class="btn btn-default btn-block">
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

