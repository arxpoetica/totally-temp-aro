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
    //this.budgetDisplay = this.state.optimizationOptions.budget / 1000
    this.budgetDisplay = this.state.optimizationOptions.budget
    
    
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })

    state.planOptimization.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })

    state.selectedLocations.subscribe((selectedLocations) => {
      // The selected locations have changed. Get the count and addresses that we want to show
      console.log(selectedLocations)
      this.targetsTotal = selectedLocations.size
      var locationIds = Array.from(selectedLocations) // Only get addresses for a few locations
      $http.post('/network_plan/targets/addresses', { locationIds: locationIds })
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          this.targets = result.data
        }
      })
    })

    state.selectedServiceAreas.subscribe((selectedServiceAreas) => {
      // The selected SA have changed.
      console.log(selectedServiceAreas)
      var serviceAreaIds = Array.from(selectedServiceAreas)
      $http.post('/network_plan/service_area/addresses', { serviceAreaIds: serviceAreaIds })
      .then((result) => {
        if (result.status >= 200 && result.status <= 299) {
          this.serviceAreas = result.data
        }
      })
    })  
    
    state.selectedAnalysisArea.subscribe((selectedAnalysisAreas) => {
      console.log(selectedAnalysisAreas)
    })
    
    state.mapFeaturesSelectedEvent.subscribe((event) => {
      console.log(event)
      if (event.analysisAreas){
        event.analysisAreas.forEach((item, index) => {
          console.log(item)
          console.log(index)
          //var geometry = feature.loadGeometry()
          //this.state.StateViewMode.reloadSelectedAnalysisArea(this.state, item.id)
          /*
          this.state.requestPolygonSelect.next({
            coords: [all the coords here]
          })
          */
          var filter = `(id eq ${item.id})`
          $http.get(`/service/odata/analysisarea?$filter=${filter}&$top=1`)
          .then((results) => {
            console.log(results)
            this.state.requestPolygonSelect.next({
              coords: results.data[0].geog.coordinates[0][0]
            })
          })
          
          
        })
      }
      
    })
  }

  onSelectionTypeChange(selectionType) {
    this.state.selectionTypeChanged.next(selectionType)
  } 
  
  
  onBudgetChange(){
    //this.state.optimizationOptions.budget = this.budgetDisplay * 1000
    this.state.optimizationOptions.budget = this.budgetDisplay
  }
  
}

NetworkBuildController.$inject = ['$http', 'state', 'optimization']

let networkBuild = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build.html',
  bindings: {
    removeTarget: '&', 
    zoomTarget: '&',
    removeServiceArea: '&'
  },
  controller: NetworkBuildController
}

export default networkBuild