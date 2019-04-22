class NetworkAnalysisOutputController {
  constructor ($element, $timeout, state) {
    this.$element = $element
    this.$timeout = $timeout
    this.showGraph = false

    this.showOutput = () => {
      state.showNetworkAnalysisOutput = true
    }

    state.plan
      .subscribe((plan) => {
        this.downloadLink = `/reports/network_analysis/download/${plan.id}/4`
      })
  }

  $doCheck () {
    // Show the graph only if the element width is large enough
    var oldShowGraph = this.showGraph

    // A convoluted implementation for a reason - When the component is shown for the first time,
    // this.$element[0].offsetWidth isn't set to the width of the container. setTimeout() takes
    // care of that. IF the showGraph value has changed, then we want to do a $timeout() which
    // calls $scope.$apply(). If we wrap everything in a $timeout(), the digest cycle will keep
    // getting called all the time.
    setTimeout(() => {
      var collapseThresholdInPixels = 300
      this.showGraph = this.$element[0].offsetWidth > collapseThresholdInPixels
      if (oldShowGraph !== this.showGraph) {
        this.$timeout()
      }
    })
  }

  $onInit () {
    // We must apply display:block on $element[0] in order for its size to be reported correctly in $doCheck
    this.$element[0].style.display = 'block'
  }
}

NetworkAnalysisOutputController.$inject = ['$element', '$timeout', 'state']

let networkAnalysisOutput = {
  templateUrl: '/components/sidebar/analysis/network-analysis/network-analysis-output.html',
  bindings: {},
  controller: NetworkAnalysisOutputController
}

export default networkAnalysisOutput
