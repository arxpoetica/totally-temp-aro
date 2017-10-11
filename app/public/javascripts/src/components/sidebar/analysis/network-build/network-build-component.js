class NetworkBuildController {

  constructor($http, state, optimization) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.targets = []
    this.targetsTotal = 0
    this.serviceAreas = []
    this.config = config

    this.areControlsEnabled = true
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })

    state.selectedLocations
      .subscribe((selectedLocations) => {
        // The selected locations have changed. Get the count and addresses that we want to show
        this.targetsTotal = selectedLocations.size
        var locationIds = Array.from(selectedLocations) // Only get addresses for a few locations
        $http.post('/network_plan/targets/addresses', { locationIds: locationIds })
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              this.targets = result.data
            }
          })
      })

    state.selectedServiceAreas
      .subscribe((selectedServiceAreas) => {
        // The selected SA have changed.
        var serviceAreaIds = Array.from(selectedServiceAreas)
        $http.post('/network_plan/service_area/addresses', { serviceAreaIds: serviceAreaIds })
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              this.serviceAreas = result.data
            }
          })
      }) 

    var numberOfRows = $("#tblNetworkBuild>tbody>tr").length;
    $("#tblNetworkBuild").bind("DOMSubtreeModified", function () {
      if ($("#tblNetworkBuild>tbody>tr").length !== numberOfRows) {
        numberOfRows = $("#tblNetworkBuild>tbody>tr").length;
        setTimeout(() => this.updateShowTargetHeight(), 100)
      }
    }.bind(this));
  }

  $onInit() {
    this.updateShowTargetHeight()
  }

  updateShowTargetHeight() {
    var targetId
    if (this.state.optimizationOptions.analysisSelectionMode === 'SELECTED_AREAS') {
      targetId = '#network-build-target-geog>#show-targets'
    } else if (this.state.optimizationOptions.analysisSelectionMode === 'SELECTED_LOCATIONS') {
      targetId = '#network-build-target-loc>#show-targets'
    }

    if ($(targetId).offset()) {
      if ($('#output-bar').offset().top - $(targetId).offset().top > 100) {
        $(targetId).css('max-height', ($('#output-bar').offset().top - $(targetId).offset().top - 25) + 'px')
      } else {
        $(targetId).css('max-height', '100px')
      }
    }
  }
}

NetworkBuildController.$inject = ['$http', 'state', 'optimization']

app.component('networkBuild', {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-component.html',
  bindings: {
    removeTarget: '&', 
    zoomTarget: '&',
    removeServiceArea: '&'
  },
  controller: NetworkBuildController
})    