class PlanInputsModalController {
  constructor (state, $element, $http, $ngRedux) {
    this.state = state
    this.$element = $element
    this.$http = $http
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    this.$element.find('#plan_inputs_modal > .modal-dialog').css('width', '350') // Ugh.. But.. legacy code. Leave for now
  }

  initModalData () {
    this.planName = null
    this.parentPlan = null
    this.planType = 'UNDEFINED'
    const currentPlan = this.state.plan
    if (currentPlan && !currentPlan.ephemeral) {
      // IF the current plan is not an ephemeral plan, then set it as the parent plan.
      this.parentPlan = currentPlan
    }
    this.parentPlanSelectorExpanded = false
    this.allPlanTypes = {
      UNDEFINED: 'Standard Plan',
      NETWORK_PLAN: 'Network Build',
      NETWORK_ANALYSIS: 'Network Analysis',
      COVERAGE: 'Coverage Plan',
      MANUAL: 'Manual Plan',
      RFP: 'RFP',
      RING: 'Ring Plan'
    }
    // Users can control the list of allowed plan types via a database setting
    var allPlanTypes = []
    var allowedPlanTypes = []
    this.planTypes = {}
    try {
      allPlanTypes = this.state.configuration.plan.allPlanTypes
      allowedPlanTypes = this.state.configuration.plan.allowedPlanTypes
      allowedPlanTypes.forEach(allowedPlanType => { this.planTypes[allowedPlanType] = allPlanTypes[allowedPlanType] })
    } catch (err) {
      console.error('Error when determining the list of plan types to display. Plan configuration is:')
      console.error(this.state.configuration.plan)
      console.error(err)
    }
  }

  close () {
    this.state.planInputsModal.next(false)
  }

  modalShown () {
    this.initModalData()
    this.state.planInputsModal.next(true)
  }

  modalHide () {
    this.state.planInputsModal.next(false)
    this.initModalData()
  }

  savePlanAs () {
    this.checkIfSATagExists()
      .then((saTagExists) => {
        if (saTagExists) return this.checkIfPlanNameExists()
      })
      .then((planNameExists) => {
        if (!planNameExists) {
          if (this.parentPlan) {
            // A parent plan is specified. Ignore the currently open plan, and just create a new one using
            // the selected plan name and parent plan
            this.state.createNewPlan(false, this.planName, this.parentPlan, this.planType)
              .then((result) => this.state.loadPlan(result.data.id))
              .catch((err) => console.error(err))
          } else {
          // No parent plan specified
            var currentPlan = this.state.plan
            if (currentPlan.ephemeral) {
              if (this.planName) {
                this.state.makeCurrentPlanNonEphemeral(this.planName, this.planType)
                this.resetPlanInputs()
              }
            } else {
              if (this.planName) {
                this.state.copyCurrentPlanTo(this.planName, this.planType)
                this.resetPlanInputs()
              }
            }
          }
          this.close()
        }
      })
  }

  checkIfSATagExists () {
    return new Promise((resolve, reject) => {
      // For frontier client check for atleast one SA tag selected
      if (this.state.configuration.ARO_CLIENT === 'frontier') {
        if (this.state.currentPlanServiceAreaTags.length <= 0) {
          swal({
            title: 'Service Area Tag is Required',
            text: 'Select Atleast One Service Area Tag',
            type: 'error'
          })
        } else {
          resolve(true)
        }
      } else {
        resolve(true)
      }
    })
  }

  checkIfPlanNameExists () {
    return new Promise((resolve, reject) => {
      // For frontier client check for duplicate plan name
      if (this.state.configuration.ARO_CLIENT === 'frontier') {
        var filter = `(name eq '${this.planName.replace(/'/g, "''")}') and (ephemeral eq false)`
        return this.$http.get(`/service/odata/PlanSummaryEntity?$select=id,name&$filter=${encodeURIComponent(filter)}&$top=20`)
          .then((result) => {
            if (result.data.length > 0) {
              swal({
                title: 'Duplicate Plan Name',
                text: 'Plan name already exists, please enter a unique plan name',
                type: 'error'
              })
            } else {
              resolve(false)
            }
          })
      } else {
        resolve(false)
      }
    })
  }

  onParentPlanSelected (plan) {
    this.parentPlan = plan
    this.parentPlanSelectorExpanded = false
  }

  resetPlanInputs () {
    this.planName = null
    this.state.currentPlanTags = []
    this.state.currentPlanServiceAreaTags = []
    this.close()
  }

  clearParentPlan () {
    this.parentPlan = null
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems
    }
  }

  mapDispatchToTarget (dispatch) {
    return { }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

PlanInputsModalController.$inject = ['state', '$element', '$http', '$ngRedux']

let planInputsModal = {
  templateUrl: '/components/header/plan-inputs-modal.html',
  bindings: {},
  controller: PlanInputsModalController
}

export default planInputsModal
