class PlanSummaryController {
  
  constructor(state,$http) {
    this.state = state
    this.$http = $http
    this.currentTransaction = null
    this.isKeyExpanded = {
      Equipment: false,
      Fiber: false
    }
    this.summaryInstallationTypes = Object.freeze({
      INSTALLED:{id:'INSTALLED',Label:'Existing'},
      PLANNED: {id:'PLANNED',Label:'Planned'},
      Total: {id:'Total',Label:'Total'}
    })
    this.summaryCategoryTypes = {
      Equipment:{'summaryData': {},'totalSummary':{},'groupBy':'networkNodeType','aggregateBy':'count'},
      Fiber: {'summaryData': {},'totalSummary':{},'groupBy':'fiberType','aggregateBy':'lengthMeters'}
      //Coverage: {'summaryData': {},'totalSummary':{},'groupBy':'','aggregateBy':''}
    }

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })
  }

  $onInit() {
    // this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
    //   this.formatSummary(response.data)
    // })

    //TODO: get the currentTransaction from plan editor or move the code to state to get current transaction
    if (null == this.currentTransaction) {
      this.$http.get(`/service/plan-transaction?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        if (result.data.length > 0) {
          // At least one transaction exists. Return it
          return Promise.resolve({
            data: result.data[0]
          })
        } else {
          // Create a new transaction and return it.
          return this.$http.post(`/service/plan-transactions`, { userId: this.state.loggedInUser.id, planId: this.state.plan.getValue().id })
        }
      }).then((result) => {
        this.currentTransaction = result.data
        this.$http.get(`/service/plan-transaction/${this.currentTransaction.id - 1}/plan_summary/`).then((response) => {
          this.formatSummary(response.data)
        })
      })  
    } else {
      this.$http.get(`/service/plan-transaction/${this.currentTransaction.id - 1}/plan_summary/`).then((response) => {
        this.formatSummary(response.data)
      })
    }
  }

  formatSummary(planSummary) {
    var equipmentSummary = planSummary.equipmentSummary
    var fiberSummary = planSummary.fiberSummary

    this.summaryCategoryTypes['Equipment']['summaryData'] = this.transformSummary(equipmentSummary,this.summaryCategoryTypes['Equipment']['groupBy'],this.summaryCategoryTypes['Equipment']['aggregateBy'])
    this.summaryCategoryTypes['Fiber']['summaryData'] = this.transformSummary(fiberSummary,this.summaryCategoryTypes['Fiber']['groupBy'],this.summaryCategoryTypes['Fiber']['aggregateBy'])

    //Calculating Total Equipment Summary
    this.summaryCategoryTypes['Equipment']['totalSummary'] = this.calculateTotalByInstallationType(equipmentSummary,this.summaryCategoryTypes['Equipment']['aggregateBy'])
    //Calculating Total Fiber Summary
    this.summaryCategoryTypes['Fiber']['totalSummary'] = this.calculateTotalByInstallationType(fiberSummary,this.summaryCategoryTypes['Fiber']['aggregateBy'])
  }

  calculateTotalByInstallationType(equipmentSummary,aggregateBy) {
    var totalEquipmentSummary = {}
    var existingEquip = _.filter(equipmentSummary,(equipment) => equipment.deploymentType === this.summaryInstallationTypes['INSTALLED'].id)
    var plannedEquip = _.filter(equipmentSummary,(equipment) => equipment.deploymentType === this.summaryInstallationTypes['PLANNED'].id)

    // var existingEquipCountArray = _.map(existingEquip, (exitingEqu) => 'lengthMeters' in exitingEqu ? exitingEqu.lengthMeters : exitingEqu.count)    
    // var plannedEquipCountArray = _.map(plannedEquip, (plannedEqu) => 'lengthMeters' in plannedEqu ? plannedEqu.lengthMeters : plannedEqu.count)    

    var existingEquipCountArray = _.map(existingEquip, (exitingEqu) => exitingEqu[aggregateBy])    
    var plannedEquipCountArray = _.map(plannedEquip, (plannedEqu) => plannedEqu[aggregateBy])    

    var existingEquipCount = _.reduce(existingEquipCountArray, (memo, num) => memo + num, 0)
    var plannedEquipCount = _.reduce(plannedEquipCountArray, (memo, num) => memo + num, 0)
    var totalEuipCount = existingEquipCount + plannedEquipCount

    totalEquipmentSummary[this.summaryInstallationTypes['INSTALLED'].id] = [{[aggregateBy]: existingEquipCount}]
    totalEquipmentSummary[this.summaryInstallationTypes['PLANNED'].id] = [{[aggregateBy]: plannedEquipCount}]
    totalEquipmentSummary[this.summaryInstallationTypes['Total'].id] = [{[aggregateBy]: totalEuipCount}]

    return totalEquipmentSummary
  }

  transformSummary(summary,groupByCategoryType,aggregateBy) {
    var groupByNodeType = _.groupBy(summary,groupByCategoryType)
    var transformedSummary = {}

    Object.keys( groupByNodeType ).forEach( nodeType => {
      transformedSummary[nodeType] = _.groupBy(groupByNodeType[nodeType],'deploymentType')

      //Calculating total for planned and existing of a particular node type
      //transformedSummary[nodeType].Total = [{'count':_.reduce(_.map(groupByNodeType[nodeType],(obj) => 'lengthMeters' in obj ? obj.lengthMeters : obj.count), (memo, num) => memo + num, 0)}]
      transformedSummary[nodeType].Total = [{[aggregateBy]:_.reduce(_.map(groupByNodeType[nodeType],(obj) => obj[aggregateBy]), (memo, num) => memo + num, 0)}]
    });

    return transformedSummary
  }

  toggleIsKeyExpanded(type) {
    this.isKeyExpanded[type] = !this.isKeyExpanded[type]
  }
}
  
PlanSummaryController.$inject = ['state','$http']

let planSummary = {
  templateUrl: '/components/sidebar/plan-editor/plan-summary.html',
  controller: PlanSummaryController
}

export default planSummary