class PlanSummaryController {
  constructor (state, Utils, $http, $timeout, $ngRedux) {
    this.state = state
    this.Utils = Utils
    this.$http = $http
    this.$timeout = $timeout
    this.config = config
    this.isKeyExpanded = {
      Equipment: false,
      Fiber: false,
      Coverage: false
    }
    this.summaryInstallationTypes = Object.freeze({
      INSTALLED: { id: 'INSTALLED', Label: 'Existing' },
      PLANNED: { id: 'PLANNED', Label: 'Planned' },
      Total: { id: 'Total', Label: 'Total' }
    })
    this.summaryCategoryTypes = {
      Equipment: { 'summaryData': {}, 'totalSummary': {}, 'groupBy': 'networkNodeType', 'aggregateBy': 'count' },
      Fiber: { 'summaryData': {}, 'totalSummary': {}, 'groupBy': 'fiberType', 'aggregateBy': 'lengthMeters' },
      Coverage: { 'summaryData': {}, 'totalSummary': {}, 'groupBy': 'locationEntityType', 'aggregateBy': 'count' }
    }

    this.equipmentOrder = []
    this.fiberOrder = []
    this.locTagCoverage = []
    this.planEditorChangedObserver = state.planEditorChanged.subscribe((isPlanEditorChanged) => isPlanEditorChanged && this.getPlanSummary())
    this.layerTagCategories = this.state.layerCategories.getValue()
    this.layerTagCategoriesObserver = this.state.layerCategories.subscribe((newValue) => {
      this.layerTagCategories = newValue
      this.layerTagTodescription = {}
      Object.keys(this.layerTagCategories).forEach((categoryId) => {
        Object.keys(this.layerTagCategories[categoryId].tags).forEach((tagId) => {
          var tag = this.layerTagCategories[categoryId].tags[tagId]
          this.layerTagTodescription[tag.id] = tag.description
        })
      })
    })
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  $onInit () {
    this.selectedBoundaryType = this.state.selectedBoundaryType

    // fetching equipment order from networkEquipment.json
    var equipmentOrderKey = this.summaryCategoryTypes['Equipment']['groupBy']
    this.equipmentOrder = this.orderSummaryByCategory(this.state.configuration.networkEquipment.equipments, equipmentOrderKey)
    this.equipmentOrder.push('junction_splitter')

    // fetching location order from locationCategories.json
    var coverageOrderKey = 'plannerKey'
    this.coverageOrder = this.orderSummaryByCategory(this.state.configuration.locationCategories.categories, coverageOrderKey)
    this.isLocKeyExpanded = this.coverageOrder.reduce(function (result, item, index, array) {
      result[item] = false
      return result
    }, {})
  }

  orderSummaryByCategory (obj, key) {
    var categoryOrder = []

    // for (const [objKey, objValue] of Object.entries(obj)) {
    Object.keys(obj).forEach(objKey => {
      categoryOrder.push(obj[objKey][key])
    })

    return categoryOrder
  }

  getPlanSummary () {
    this.cachedRawSummary = null
    if (this.currentTransaction) {
      this.$http.get(`/service/plan-transaction/${this.currentTransaction.id}/plan_summary/`)
        .then((response) => {
          this.cachedRawSummary = response.data
          this.formatSummary(this.cachedRawSummary)
          this.$timeout()
        })
    }
  }

  formatSummary (planSummary) {
    // Order Equipment Summary
    var OrderedEquipmentSummary = _.sortBy(planSummary.equipmentSummary, (obj) => _.indexOf(this.equipmentOrder, obj.networkNodeType))
    var equipmentSummary = OrderedEquipmentSummary

    var fiberSummary = planSummary.fiberSummary

    // Preprocessing Coverage Summary (rolling up tagSetCounts to count) and order
    var rawCoverageSummary = planSummary.equipmentCoverageSummary
    var orderedRawCoverageSummary = _.sortBy(rawCoverageSummary, (obj) => _.indexOf(this.coverageOrder, obj.locationEntityType))
    var processedCoverageSummary = this.processCoverageSummary(orderedRawCoverageSummary)

    this.summaryCategoryTypes['Equipment']['summaryData'] = this.transformSummary(equipmentSummary, this.summaryCategoryTypes['Equipment']['groupBy'], this.summaryCategoryTypes['Equipment']['aggregateBy'])
    this.summaryCategoryTypes['Fiber']['summaryData'] = this.transformSummary(fiberSummary, this.summaryCategoryTypes['Fiber']['groupBy'], this.summaryCategoryTypes['Fiber']['aggregateBy'])
    this.summaryCategoryTypes['Coverage']['summaryData'] = this.transformSummary(processedCoverageSummary, this.summaryCategoryTypes['Coverage']['groupBy'], this.summaryCategoryTypes['Coverage']['aggregateBy'])

    // Calculating Total Equipment Summary
    this.summaryCategoryTypes['Equipment']['totalSummary'] = this.calculateTotalByInstallationType(equipmentSummary, this.summaryCategoryTypes['Equipment']['aggregateBy'])
    // Calculating Total Fiber Summary
    this.summaryCategoryTypes['Fiber']['totalSummary'] = this.calculateTotalByInstallationType(fiberSummary, this.summaryCategoryTypes['Fiber']['aggregateBy'])
    // Calculating Total Coverage Summary
    this.summaryCategoryTypes['Coverage']['totalSummary'] = this.calculateTotalByInstallationType(processedCoverageSummary, this.summaryCategoryTypes['Coverage']['aggregateBy'])
  }

  calculateTotalByInstallationType (equipmentSummary, aggregateBy) {
    var totalEquipmentSummary = {}
    var existingEquip = equipmentSummary.filter(equipment => equipment.deploymentType === this.summaryInstallationTypes['INSTALLED'].id)
    var plannedEquip = equipmentSummary.filter(equipment => equipment.deploymentType === this.summaryInstallationTypes['PLANNED'].id)

    var existingEquipCountArray = existingEquip.map(exitingEqu => exitingEqu[aggregateBy])
    var plannedEquipCountArray = plannedEquip.map(plannedEqu => plannedEqu[aggregateBy])

    var existingEquipCount = existingEquipCountArray.length && existingEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    var plannedEquipCount = plannedEquipCountArray.length && plannedEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    var totalEuipCount = existingEquipCount + plannedEquipCount

    totalEquipmentSummary[this.summaryInstallationTypes['INSTALLED'].id] = [{ [aggregateBy]: existingEquipCount }]
    totalEquipmentSummary[this.summaryInstallationTypes['PLANNED'].id] = [{ [aggregateBy]: plannedEquipCount }]
    totalEquipmentSummary[this.summaryInstallationTypes['Total'].id] = [{ [aggregateBy]: totalEuipCount }]

    return totalEquipmentSummary
  }

  transformSummary (summary, groupByCategoryType, aggregateBy) {
    var groupByNodeType = _.groupBy(summary, groupByCategoryType)
    var transformedSummary = {}

    Object.keys(groupByNodeType).forEach(nodeType => {
      transformedSummary[nodeType] = _.groupBy(groupByNodeType[nodeType], 'deploymentType')

      // Calculating total for planned and existing of a particular node type
      // transformedSummary[nodeType].Total = [{'count':_.reduce(_.map(groupByNodeType[nodeType],(obj) => 'lengthMeters' in obj ? obj.lengthMeters : obj.count), (memo, num) => memo + num, 0)}]
      transformedSummary[nodeType].Total = [{ [aggregateBy]: _.reduce(_.map(groupByNodeType[nodeType], (obj) => obj[aggregateBy]), (memo, num) => memo + num, 0) }]
    })

    return transformedSummary
  }

  processCoverageSummary (summary) {
    var selectedBoundaryCoverageSummary = summary.filter(row => row.boundaryTypeId === this.state.selectedBoundaryType.id)
    selectedBoundaryCoverageSummary.forEach((row) => {
      // calculate count by aggregating 'count' in 'tagSetCounts' array of objects
      var tagSetCountsArray = row['tagSetCounts'].map(tagset => tagset['count'])
      row['count'] = tagSetCountsArray.length && tagSetCountsArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    })

    return selectedBoundaryCoverageSummary
  }

  toggleIsKeyExpanded (type) {
    this.isKeyExpanded[type] = !this.isKeyExpanded[type]
  }

  togglelocationTagCoverage (selectedCoverageLoc) {
    this.isLocKeyExpanded[selectedCoverageLoc] = !this.isLocKeyExpanded[selectedCoverageLoc]
    // creating dummy install data
    // this.summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc]['INSTALLED'] = [{"deploymentType":"INSTALLED","nodeType":"dslam","locationEntityType":"small","boundaryTypeId":1,"tagSetCounts":[{"tagSet":[16],"count":1},{"tagSet":[13],"count":1}],"count":2}]

    var installedId = this.summaryInstallationTypes['INSTALLED'].id
    var plannedId = this.summaryInstallationTypes['PLANNED'].id
    var totalId = this.summaryInstallationTypes['Total'].id

    // get a location specific tagSetCounts per deploymentType
    var existing = this.summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][installedId] &&
      this.summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][installedId][0].tagSetCounts
    // differentiate tagSetCounts based on deploymentType which is used to display
    existing && existing.map(tag => tag.deploymentType = installedId)

    var planned = this.summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][plannedId] &&
      this.summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][plannedId][0].tagSetCounts
    planned && planned.map(tag => tag.deploymentType = plannedId)

    var tempTagSetCountsData = []
    existing && existing.map((arr) => tempTagSetCountsData.push(arr))
    planned && planned.map((arr) => tempTagSetCountsData.push(arr))

    var groupByTag = _.groupBy(tempTagSetCountsData, 'tagSet')

    var groupByTagDeploymentType = {}
    Object.keys(groupByTag).forEach((tag) => {
      groupByTagDeploymentType[tag] = _.groupBy(groupByTag[tag], 'deploymentType')
      groupByTagDeploymentType[tag][totalId] = [{ 'count': _.reduce(_.map(groupByTag[tag], (obj) => obj['count']), (memo, num) => memo + num, 0) }]
    })

    this.locTagCoverage[selectedCoverageLoc] = groupByTagDeploymentType
  }

  $doCheck () {
    // Selected boundary type has changed
    if (this.selectedBoundaryType.id !== this.state.selectedBoundaryType.id) {
      // this.getPlanSummary()
      this.formatSummary(this.cachedRawSummary)
      this.selectedBoundaryType = this.state.selectedBoundaryType
    }
  }

  $onDestroy () {
    this.planEditorChangedObserver.unsubscribe()
    this.layerTagCategoriesObserver.unsubscribe()
    this.locTagCoverage = []
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      currentTransaction: reduxState.planEditor.transaction
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }

  mergeToTarget (nextState, actions) {
    const oldTransaction = this.currentTransaction
    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if (oldTransaction !== this.currentTransaction) {
      // Current transaction has changed. Recalculate plan summary.
      this.getPlanSummary()
    }
  }
}

PlanSummaryController.$inject = ['state', 'Utils', '$http', '$timeout', '$ngRedux']

let planSummary = {
  templateUrl: '/components/sidebar/plan-editor/plan-summary.html',
  bindings: {},
  controller: PlanSummaryController
}

export default planSummary
