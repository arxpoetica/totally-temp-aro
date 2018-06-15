class PlanSummaryController {
  
  constructor(state,$http) {
    this.state = state
    this.$http = $http
    this.isKeyExpanded = {
      Equipment: true,
      Fiber: false
    }
    this.summaryInstallationTypes = Object.freeze({
      INSTALLED:{id:'INSTALLED',Label:'Existing'},
      PLANNED: {id:'PLANNED',Label:'Planned'},
      Total: {id:'Total',Label:'Total'}
    })

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })
  }

  $onInit() {
    this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
      this.formatSummary(response.data)
    })
  }

  formatSummary(planSummary) {
    var equipmentSummary = planSummary.equipmentSummary
    var fiberSummary = planSummary.fiberSummary

    this.transformedEquipmentSummary = this.transformSummary(equipmentSummary)

    //Calculating Total Equipment Summary
    this.totalEquipmentSummary = this.calculateTotalByInstallationType(equipmentSummary)
  }

  calculateTotalByInstallationType(equipmentSummary) {
    var totalEquipmentSummary = {}
    var existingEquip = _.filter(equipmentSummary,(equipment) => equipment.deploymentType === this.summaryInstallationTypes['INSTALLED'].id)
    var plannedEquip = _.filter(equipmentSummary,(equipment) => equipment.deploymentType === this.summaryInstallationTypes['PLANNED'].id)

    var existingEquipCountArray = _.map(existingEquip, (exitingEqu) => exitingEqu.count)    
    var plannedEquipCountArray = _.map(plannedEquip, (plannedEqu) => plannedEqu.count)    

    var existingEquipCount = _.reduce(existingEquipCountArray, (memo, num) => memo + num, 0)
    var plannedEquipCount = _.reduce(plannedEquipCountArray, (memo, num) => memo + num, 0)
    var totalEuipCount = existingEquipCount + plannedEquipCount

    totalEquipmentSummary[this.summaryInstallationTypes['INSTALLED'].id] = [{'count': existingEquipCount}]
    totalEquipmentSummary[this.summaryInstallationTypes['PLANNED'].id] = [{'count': plannedEquipCount}]
    totalEquipmentSummary[this.summaryInstallationTypes['Total'].id] = [{'count': totalEuipCount}]

    return totalEquipmentSummary
  }

  transformSummary(summary) {
    var groupByNodeType = _.groupBy(summary,'networkNodeType')
    var transformedSummary = {}

    Object.keys( groupByNodeType ).forEach( nodeType => {
      transformedSummary[nodeType] = _.groupBy(groupByNodeType[nodeType],'deploymentType')

      //Calculating total for planned and existing of a particular node type
      transformedSummary[nodeType].Total = [{'count':_.reduce(_.map(groupByNodeType[nodeType],(obj) => obj.count), (memo, num) => memo + num, 0)}]
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