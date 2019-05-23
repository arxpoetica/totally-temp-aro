class AnalysisExpertModeController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
    this.scopeContextKeys = []
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

  $onInit () {
    this.$http.get(`/service/v1/plan/${this.state.plan.id}/scope-context?user_id=${this.state.loggedInUser.id}`)
    .then((result) => {
      this.state.expertModeScopeContext = result.data
      this.getAvailableScopeContextKeys(this.state.expertModeScopeContext)
    })
  }

  getAvailableScopeContextKeys(obj, parentKey) {
    Object.keys(obj).forEach((key) => {
      if (obj[key] instanceof Object) {
        var superKey = parentKey == null ? key : parentKey + "." + key
        this.getAvailableScopeContextKeys(obj[key], superKey)
      } else {
        parentKey == null ? this.scopeContextKeys.push(key) : this.scopeContextKeys.push(parentKey + "." + key)
      }
    })
  }

  $onDestroy() {
    this.scopeContextKeys = []
  }

}

AnalysisExpertModeController.$inject = ['$http','state']

let analysisExpertMode = {
  templateUrl: '/components/sidebar/analysis/analysis-expert-mode.html',
  controller: AnalysisExpertModeController
}

export default analysisExpertMode
