class AnalysisModeController {

  constructor(state) {
    this.state = state
  }

}

AnalysisModeController.$inject = ['state']

app.component('analysisMode', {
  template: `
    <style>
      .analysis-mode {
        width: 100%;
        height: 100%;
        margin-top: 10px;
      }
    </style>
    <div class="analysis-mode">
      <h4 style="text-align: center;">{{$ctrl.state.networkAnalysisType}}</h4>
      <button class="btn btn-default btn-block">
        <i class="fa fa-bolt"></i> Run
      </button>
    </div>
  `,
  bindings: {},
  controller: AnalysisModeController
})

