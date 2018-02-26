class AnalysisExpertModeController {
  
    constructor(state) {
      this.state = state
      this.state.expertModeBody = JSON.stringify(this.state.getOptimizationBody(), undefined, 4)
      this.expertModeBody = JSON.stringify(this.state.getOptimizationBody(), undefined, 4)
    }

    saveExpertmode() {
      this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertModeBody))
    }
  }
  
  AnalysisExpertModeController.$inject = ['state']
  
  app.component('analysisExpertMode', {
    template: `
      <div class="row" style="height:100%">
        <div class="col-md-12" style="height:80%">
          <textarea rows="20" ng-model="$ctrl.state.expertModeBody" style="font-family: 'Courier'; width:100%; height:100%" spellcheck="false"> 
          </textarea>
        </div>
        <!--<div class="w-100"></div>
        <div class="col-md-12">
          <button class="btn btn-primary" ng-click="$ctrl.saveExpertmode()">Save</button>
        </div>-->
      </div>
      `,
    controller: AnalysisExpertModeController
  });