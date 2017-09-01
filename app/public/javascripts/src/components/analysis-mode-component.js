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
      }
      .accordion-contents.collapsed {
        display: none;
      }
    </style>
    <div class="analysis-mode-container">
      <div class="analysis-type">
        <h4 style="text-align: center;">{{$ctrl.state.networkAnalysisType}}</h4>
        <button class="btn btn-default btn-block">
          <i class="fa fa-bolt"></i> Run
        </button>
        <hr></hr>
      </div>
      <div class="accordion-title">
        <button class="btn btn-default btn-block" ng-click="$ctrl.expandAccordion($ctrl.accordions.INPUT)">Input</button>
      </div>
      <div ng-class="{ 'accordion-contents': true, 'collapsed': $ctrl.expandedAccordionIndex !== $ctrl.accordions.INPUT }">
        content content content content content content content content content content content content content content content content content content
      </div>
      <div class="accordion-title">
        <button class="btn btn-default btn-block" ng-click="$ctrl.expandAccordion($ctrl.accordions.OUTPUT)">Output</button>
      </div>
      <div ng-class="{ 'accordion-contents': true, 'collapsed': $ctrl.expandedAccordionIndex !== $ctrl.accordions.OUTPUT }">
        content content content content content content content content content content content content content content content content content content
      </div>
    </div>
  `,
  bindings: {},
  controller: AnalysisModeController
})

