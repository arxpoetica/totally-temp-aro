class AnalysisExpertModeController {
  
    constructor(state) {
      this.state = state
      this.state.expertMode.OPTIMIZATION_SETTINGS = JSON.stringify(this.state.getOptimizationBody(), undefined, 4)
    }

    saveExpertmode() {
      this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertMode.OPTIMIZATION_SETTINGS))
    }

    validateExpertModeQuery() {
      this.state.expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].isQueryValid = this.state.expertMode.MANUAL_PLAN_TARGET_ENTRY.toLowerCase().indexOf("select") > -1
    }
  }
  
  AnalysisExpertModeController.$inject = ['state']
  
  let analysisExpertMode = {
    templateUrl: '/components/sidebar/analysis/analysis-expert-mode.html',  
    controller: AnalysisExpertModeController
  }

export default analysisExpertMode 