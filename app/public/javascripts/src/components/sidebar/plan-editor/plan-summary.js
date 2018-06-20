class PlanSummaryController {
  
  constructor(state,$http,$timeout) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.currentTransaction = null
    this.config = config
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

    this.equipmentOrder = ['central_office','dslam','fiber_distribution_hub','fiber_distribution_terminal','bulk_distribution_terminal',
    'splice_point','cell_5g','junction_splitter']
    
    state.plan.subscribe((plan) => this.plan = plan)
    this.planEditorChangedObserver = state.planEditorChanged.subscribe((isPlanEditorChanged) => isPlanEditorChanged && this.getPlanSummary())
  }

  $onInit() {
    // this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
    //   this.formatSummary(response.data)
    // })

    this.$timeout(() => this.getPlanSummary(),1000)
  }

  getPlanSummary() {
    if (null == this.currentTransaction) {
      this.state.resumeTransaction()
        .then((result) => {
          this.currentTransaction = result.data
          this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/plan_summary/`).then((response) => {
            this.formatSummary(response.data)
          })
        })
    } else {
      this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/plan_summary/`).then((response) => {
        this.formatSummary(response.data)
      })
    }
  }

  formatSummary(planSummary) {
    var OrderedEquipmentSummary = _.sortBy(planSummary.equipmentSummary, (obj) => _.indexOf(this.equipmentOrder, obj.networkNodeType))
    var equipmentSummary = OrderedEquipmentSummary
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
    var existingEquip = equipmentSummary.filter(equipment => equipment.deploymentType === this.summaryInstallationTypes['INSTALLED'].id)
    var plannedEquip = equipmentSummary.filter(equipment => equipment.deploymentType === this.summaryInstallationTypes['PLANNED'].id)
    
    var existingEquipCountArray = existingEquip.map(exitingEqu => exitingEqu[aggregateBy])    
    var plannedEquipCountArray = plannedEquip.map(plannedEqu => plannedEqu[aggregateBy])   

    var existingEquipCount = existingEquipCountArray.length && existingEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    var plannedEquipCount = plannedEquipCountArray.length && plannedEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
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

  $onDestroy() {
    this.planEditorChangedObserver.unsubscribe()
  }
}
  
PlanSummaryController.$inject = ['state','$http','$timeout']

let planSummary = {
  templateUrl: '/components/sidebar/plan-editor/plan-summary.html',
  controller: PlanSummaryController
}

export default planSummary