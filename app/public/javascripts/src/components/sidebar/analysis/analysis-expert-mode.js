class AnalysisExpertModeController {
  
    constructor(state) {
      this.state = state
      this.state.expertMode.OPTIMIZATION_SETTINGS = JSON.stringify(this.state.getOptimizationBody(), undefined, 4)
    }

    saveExpertmode() {
      this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertMode.OPTIMIZATION_SETTINGS))
    }
  }
  
  AnalysisExpertModeController.$inject = ['state']
  
  let analysisExpertMode = {
    templateUrl: '/components/sidebar/analysis/analysis-expert-mode.html',  
    controller: AnalysisExpertModeController
  }

export default analysisExpertMode 