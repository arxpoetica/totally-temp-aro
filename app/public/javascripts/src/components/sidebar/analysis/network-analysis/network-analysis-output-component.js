class NetworkAnalysisOutputController {

  constructor($element, state) {
    this.$element = $element
    this.showGraph = false
    
    this.showOutput = () => {
      state.showNetworkAnalysisOutput.next(true)
    }

    state.plan
    .subscribe((plan) => {
      this.downloadLink = `/reports/network_analysis/download/${plan.id}/optimization_analysis`
    })
  }

  $doCheck() {
    // Show the graph only if the element width is large enough
    this.showGraph = this.$element[0].offsetWidth > 300
  }

  $onInit() {
    // We must apply display:block on $element[0] in order for its size to be reported correctly in $doCheck
    this.$element[0].style.display = 'block'
  }
}

NetworkAnalysisOutputController.$inject = ['$element', 'state']

app.component('networkAnalysisOutput', {
  templateUrl: '/components/sidebar/analysis/network-analysis/network-analysis-output-component.html',
  bindings: {},
  controller: NetworkAnalysisOutputController
})    