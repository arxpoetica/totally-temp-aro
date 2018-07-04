class PlanSummaryController {
  
  constructor(state,configuration,Utils,$http,$timeout) {
    this.state = state
    this.configuration = configuration
    this.Utils = Utils
    this.$http = $http
    this.$timeout = $timeout
    this.currentTransaction = null
    this.config = config
    this.isKeyExpanded = {
      Equipment: false,
      Fiber: false,
      Coverage: false
    }
    this.summaryInstallationTypes = Object.freeze({
      INSTALLED:{id:'INSTALLED',Label:'Existing'},
      PLANNED: {id:'PLANNED',Label:'Planned'},
      Total: {id:'Total',Label:'Total'}
    })
    this.summaryCategoryTypes = {
      Equipment:{'summaryData': {},'totalSummary':{},'groupBy':'networkNodeType','aggregateBy':'count'},
      Fiber: {'summaryData': {},'totalSummary':{},'groupBy':'fiberType','aggregateBy':'lengthMeters'},
      Coverage: {'summaryData': {},'totalSummary':{},'groupBy':'locationEntityType','aggregateBy':'count'}
    }

    this.equipmentOrder = []
    this.fiberOrder = []
    
    state.plan.subscribe((plan) => { 
      this.plan = plan 
      this.downloadLink = `/reports/planSummary/${this.plan.id}`
    })
    this.planEditorChangedObserver = state.planEditorChanged.subscribe((isPlanEditorChanged) => isPlanEditorChanged && this.getPlanSummary())
  }

  $onInit() {
    // this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
    //   this.formatSummary(response.data)
    // })

    this.selectedBoundaryType = this.state.selectedBoundaryType

    //fetching equipment order from networkEquipment.json
    var equipmentOrderKey = this.summaryCategoryTypes['Equipment']['groupBy']
    this.equipmentOrder = this.orderSummaryByCategory(this.configuration.networkEquipment.equipments,equipmentOrderKey)
    this.equipmentOrder.push('junction_splitter')
    
    // var fiberOrderKey = this.summaryCategoryTypes['Fiber']['groupBy']
    // this.fiberOrder = this.orderSummaryByCategory(this.configuration.networkEquipment.cables,fiberOrderKey)

    //fetching location order from locationCategories.json
    var coverageOrderKey = 'plannerKey'
    this.coverageOrder = this.orderSummaryByCategory(this.configuration.locationCategories.categories,coverageOrderKey)

    this.$timeout(() => this.getPlanSummary(),1000)
  }

  orderSummaryByCategory(obj,key) {
    var categoryOrder = []

    for (const [objKey, objValue] of Object.entries(obj)) {
      categoryOrder.push(objValue[key])
    }

    return categoryOrder
  }

  getPlanSummary() {
    if (null == this.currentTransaction) {
      this.state.resumeOrCreateTransaction()
        .then((result) => {
          this.currentTransaction = result.data
          this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/plan_summary/`).then((response) => {
            this.cachedRawSummary = response.data
            this.formatSummary(this.cachedRawSummary)
          })
        })
        .catch((err) => {
          this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
          this.$timeout()
          console.warn(err)
        })
    } else {
      this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/plan_summary/`).then((response) => {
        this.cachedRawSummary = response.data
        this.formatSummary(this.cachedRawSummary)
      })
    }
  }

  formatSummary(planSummary) {
    //Order Equipment Summary
    var OrderedEquipmentSummary = _.sortBy(planSummary.equipmentSummary, (obj) => _.indexOf(this.equipmentOrder, obj.networkNodeType))
    var equipmentSummary = OrderedEquipmentSummary

    var fiberSummary = planSummary.fiberSummary

    //Preprocessing Coverage Summary (rolling up tagSetCounts to count) and order
    var rawCoverageSummary = planSummary.equipmentCoverageSummary
    var orderedRawCoverageSummary = _.sortBy(rawCoverageSummary, (obj) => _.indexOf(this.coverageOrder, obj.locationEntityType))
    var processedCoverageSummary = this.processCoverageSummary(orderedRawCoverageSummary)

    this.summaryCategoryTypes['Equipment']['summaryData'] = this.transformSummary(equipmentSummary,this.summaryCategoryTypes['Equipment']['groupBy'],this.summaryCategoryTypes['Equipment']['aggregateBy'])
    this.summaryCategoryTypes['Fiber']['summaryData'] = this.transformSummary(fiberSummary,this.summaryCategoryTypes['Fiber']['groupBy'],this.summaryCategoryTypes['Fiber']['aggregateBy'])
    this.summaryCategoryTypes['Coverage']['summaryData'] = this.transformSummary(processedCoverageSummary,this.summaryCategoryTypes['Coverage']['groupBy'],this.summaryCategoryTypes['Coverage']['aggregateBy'])

    //Calculating Total Equipment Summary
    this.summaryCategoryTypes['Equipment']['totalSummary'] = this.calculateTotalByInstallationType(equipmentSummary,this.summaryCategoryTypes['Equipment']['aggregateBy'])
    //Calculating Total Fiber Summary
    this.summaryCategoryTypes['Fiber']['totalSummary'] = this.calculateTotalByInstallationType(fiberSummary,this.summaryCategoryTypes['Fiber']['aggregateBy'])
    //Calculating Total Coverage Summary
    this.summaryCategoryTypes['Coverage']['totalSummary'] = this.calculateTotalByInstallationType(processedCoverageSummary,this.summaryCategoryTypes['Coverage']['aggregateBy'])
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

  processCoverageSummary(summary) {
    var selectedBoundaryCoverageSummary = summary.filter(row => row.boundaryTypeId === this.state.selectedBoundaryType.id)
    selectedBoundaryCoverageSummary.forEach((row) => {
      //calculate count by aggregating 'count' in 'tagSetCounts' array of objects
      var tagSetCountsArray = row['tagSetCounts'].map(tagset => tagset['count']) 
      row['count'] = tagSetCountsArray.length && tagSetCountsArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    })

    return selectedBoundaryCoverageSummary
  }

  toggleIsKeyExpanded(type) {
    this.isKeyExpanded[type] = !this.isKeyExpanded[type]
  }

  downloadPlanSummary() {
    this.$http.get(`/reports/planSummary/${this.plan.id}`).then((response) => {
      this.Utils.downloadCSV(response.data,"planSummary.csv")
    })
  }

  $doCheck() {
    // Selected boundary type has changed
    if(this.selectedBoundaryType.id !== this.state.selectedBoundaryType.id) {
      //this.getPlanSummary()
      this.formatSummary(this.cachedRawSummary)
      this.selectedBoundaryType = this.state.selectedBoundaryType
    }
  }

  $onDestroy() {
    this.planEditorChangedObserver.unsubscribe()
  }
}
  
PlanSummaryController.$inject = ['state','configuration','Utils','$http','$timeout']

let planSummary = {
  templateUrl: '/components/sidebar/plan-editor/plan-summary.html',
  controller: PlanSummaryController
}

export default planSummary