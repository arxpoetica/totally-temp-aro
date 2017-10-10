class OptimizeButtonController {
  constructor(state, $http, regions, tileDataService) {
    this.state = state
    this.$http = $http
    this.regions = regions
    this.tileDataService = tileDataService
    this.selectedRegions = []
    this.modifyDialogResult = Object.freeze({
      SAVEAS: 0,
      OVERWRITE: 1
    })

    this.progressPollingInterval = null
    this.progressMessage = ''
    this.progressPercent = 0
    this.isCanceling = false  // True when we have requested the server to cancel a request
    this.plan = null
    state.plan.subscribe((newPlan) => {
      this.stopPolling()
      this.plan = newPlan
      this.isCanceling = false
      if (this.plan && this.plan.planState === 'STARTED') {
        // Optimization is in progress. We can start polling for the results
        this.startPolling()
      }
    })
  }

  startPolling() {
    this.stopPolling()
    this.progressPollingInterval = setInterval(() => {
      this.$http.get(`/service/optimization/processes/${this.plan.optimizationId}`).then((response) => {
        var newPlan = JSON.parse(JSON.stringify(this.state.plan.getValue()))
        newPlan.planState = response.data.optimizationState
        this.state.plan.next(newPlan)
        if (response.data.optimizationState === 'COMPLETED'
            || response.data.optimizationState === 'CANCELED'
            || response.data.optimizationState === 'FAILED') {
          this.stopPolling()
          this.refreshMapTilesCacheAndData()
        }
        var diff = (Date.now() - new Date(response.data.startDate).getTime()) / 1000
        var minutes = Math.floor(diff / 60)
        var seconds = Math.ceil(diff % 60)
        this.progressPercent = response.data.progress * 100
        this.progressMessage = `${minutes < 10 ? '0': ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} Runtime`
      })
    }, 1000)
  }

  stopPolling() {
    if (this.progressPollingInterval) {
      clearInterval(this.progressPollingInterval)
      this.progressPollingInterval = null
    }
  }

  runOptimization() {

    this.refreshMapTilesCacheAndData()
    // Get the optimization options that we will pass to the server
    var optimizationBody = this.state.getOptimizationBody()
    // Make the API call that starts optimization calculations on aro-service
    var apiUrl = (this.state.networkAnalysisType.type === 'NETWORK_ANALYSIS') ? '/service/v1/analyze/masterplan' : '/service/v1/optimize/masterplan'
    this.$http.post(apiUrl, optimizationBody)
      .then((response) => {
        if (response.status >= 200 && response.status <= 299) {
          this.plan.optimizationId = response.data.optimizationIdentifier
          this.startPolling()
        } else {
          console.error(response)
        }
      })
  }

  cancelOptimization() {
    this.stopPolling()
    this.isCanceling = true
    this.$http.delete(`/service/optimization/processes/${this.plan.optimizationId}`)
      .then((response) => {
        // Optimization process was cancelled. Get the plan status from the server
        return this.$http.get(`/service/v1/plan/${this.plan.id}?user_id=${this.state.getUserId()}`)
      })
      .then((response) => {
        this.isCanceling = false
        if (response.status >= 200 && response.status <= 299) {
          this.plan.planState = response.data.planState
          delete this.plan.optimizationId
          this.refreshMapTilesCacheAndData()
        }
      })
      .catch((err) => {
        console.error(err)
        this.isCanceling = false
      })
  }

  refreshMapTilesCacheAndData() {
    // Refresh the tile data cache and redraw the tiles
    this.tileDataService.clearDataCache()
    this.tileDataService.markHtmlCacheDirty()
    this.state.requestMapLayerRefresh.next({})
  }

  showModifyQuestionDialog() {
    return new Promise((resolve, reject) => {
      swal({
        title: '',
        text: 'You are modifying a plan with a completed analysis. Do you wish to save into a new plan or overwrite the existing plan?  Overwriting will clear all results which were previously run.',
        type: 'info',
        confirmButtonColor: '#b9b9b9',
        confirmButtonText: 'Save as',
        cancelButtonColor: '#DD6B55',
        cancelButtonText: 'Overwrite',
        showCancelButton: true,
        closeOnConfirm: false
      }, (wasConfirmClicked) => {
        resolve(wasConfirmClicked ? this.modifyDialogResult.SAVEAS : this.modifyDialogResult.OVERWRITE)
      })
    })
  }

  handleModifyClicked() {
    var currentPlan = this.state.plan.getValue()
    var userId = this.state.getUserId()
    if (currentPlan.ephemeral) {
      // This is an ephemeral plan. Don't show any dialogs to the user, simply copy this plan over to a new ephemeral plan
      var url = `/service/v1/plan-command/copy?user_id=${userId}&source_plan_id=${currentPlan.id}&is_ephemeral=${currentPlan.ephemeral}`
      this.$http.post(url, {})
        .then((result) => {
          if (result.status >= 200 && result.status <= 299) {
            this.state.setPlan(result.data)
            this.refreshMapTilesCacheAndData()
          }
        })
        .catch((err) => console.log(err))
    } else {
      // This is not an ephemeral plan. Show a dialog to the user asking whether to overwrite current plan or save as a new one.
      this.showModifyQuestionDialog()
        .then((result) => {
          if (result === this.modifyDialogResult.SAVEAS) {
            // Ask for the name to save this plan as, then save it
            swal({
              title: 'Plan name required',
              text: 'Enter a name for saving the plan',
              type: 'input',
              showCancelButton: true,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Create Plan'
            },
            (planName) => {
              if (planName) {
                this.state.copyCurrentPlanTo(planName)
              }
            })
          } else if (result === this.modifyDialogResult.OVERWRITE) {
            // Overwrite the current plan. Delete existing results. Reload the plan from the server.
            this.$http.delete(`/service/v1/plan/${currentPlan.id}/analysis?user_id=${userId}`)
              .then((result) => {
                this.state.loadPlan(currentPlan.id)
                this.refreshMapTilesCacheAndData()
              })
          }
        })
        .catch((err) => console.log(err))
    }
  }

  areInputsComplete() {
    var isValid = false
    if ((this.state.selectedLocations.getValue().size > 0 ||
      this.state.selectedServiceAreas.getValue().size > 0) && (
        this.state.hasLocationType('business') ||
        this.state.hasLocationType('household') ||
        this.state.hasLocationType('celltower'))
    )
      isValid = true

    return isValid
  }
}

OptimizeButtonController.$inject = ['state', '$http', 'regions', 'tileDataService']

app.component('optimizeButton', {
  templateUrl: '/components/sidebar/optimize-button-component.html',
  bindings: {},
  controller: OptimizeButtonController
})