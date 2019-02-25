class AnalysisExpertModeController {
  constructor (state) {
    this.state = state
    this.state.expertMode.OPTIMIZATION_SETTINGS = JSON.stringify(this.state.getOptimizationBody(), undefined, 4)
  }

  saveExpertmode () {
    this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertMode.OPTIMIZATION_SETTINGS))
  }

  validateExpertModeQuery () {
    var hasExcludeTerm = false
    var excludeTerms = ['delete', 'drop', 'update', 'alter', 'insert', 'call', 'commit', 'create']
    excludeTerms.forEach((term) => {
      if (this.state.expertMode[this.state.selectedExpertMode].toLowerCase().indexOf(term) > -1) hasExcludeTerm = true
    })
    this.state.expertModeTypes[this.state.selectedExpertMode].isQueryValid = this.state.expertMode[this.state.selectedExpertMode].toLowerCase().indexOf('select') > -1 &&
        !hasExcludeTerm
  }
}

AnalysisExpertModeController.$inject = ['state']

let analysisExpertMode = {
  templateUrl: '/components/sidebar/analysis/analysis-expert-mode.html',
  controller: AnalysisExpertModeController
}

export default analysisExpertMode
