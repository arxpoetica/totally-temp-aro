class PriceBookEditorController {
  constructor ($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.priceBookDefinitions = []
    this.structuredPriceBookDefinitions = []
    this.pristineAssignments = []
    this.currentPriceBook = null
    this.DEFAULT_STATE_CODE = '*'
    this.statesForStrategy = [this.DEFAULT_STATE_CODE]
    this.selectedStateForStrategy = this.statesForStrategy[0]
    this.allStrategies = {}
    this.$http.get(`/service/v1/pricebook-strategies`)
      .then((result) => {
        result.data.forEach((strategy) => this.allStrategies[strategy.name] = strategy)
      })
      .catch((err) => console.error(err))
  }

  $onChanges (changesObj) {
    if (changesObj.priceBookId) {
      this.rebuildPricebookDefinitions()
    }
  }

  rebuildPricebookDefinitions () {
    if (!this.priceBookId) {
      return
    }
    this.$http.get(`/service/v1/pricebook/${this.priceBookId}`)
      .then((result) => {
        this.currentPriceBook = result.data
        return Promise.all([
          this.$http.get(`/service/v1/pricebook-strategies/${result.data.priceStrategy}`),
          this.$http.get(`/service/v1/pricebook/${this.priceBookId}/definition`),
          this.$http.get(`/service/v1/pricebook/${this.priceBookId}/assignment`)
        ])
      })
      .then((results) => {
        this.statesForStrategy = [this.DEFAULT_STATE_CODE].concat(results[0].data)
        // We want unique values in this.statesForStrategy (morphology returns '*' from the server)
        this.statesForStrategy = [...new Set(this.statesForStrategy)].sort() // array --> set --> back to array
        this.selectedStateForStrategy = this.statesForStrategy[0]
        this.priceBookDefinitions = results[1].data
        const assignmentResult = results[2].data
        // Save construction ratios keyed by state
        this.constructionRatios = {}
        assignmentResult.constructionRatios.forEach(ratio => {
          // Also change the "ratio" object so that the ratios are keyed by cable type (e.g. ARIEL or BURIED)
          var ratioValues = {}
          ratio.constructionRatios.cableConstructionRatios.forEach(item => { ratioValues[item.type] = item })
          var keyedRatio = angular.copy(ratio)
          keyedRatio.constructionRatios.cableConstructionRatios = ratioValues
          this.constructionRatios[keyedRatio.code] = keyedRatio
        })
        // Save a deep copy of the result, we can use this later if we save modifications to the server
        this.pristineAssignments = angular.copy(assignmentResult)
        this.definePriceBookForSelectedState()
        this.$timeout()
      })
      .catch((err) => console.log(err))
  }

  // Ensures that pristine cost assignments contain items for the specified state code.
  // If cost assignments are not present, the ones from state code '*' are copied into the ones for statecode.
  ensurePristineCostAssignmentsForState (stateCode) {
    const hasCostAssignmentsForState = this.pristineAssignments.costAssignments.filter((item) => item.state === stateCode).length > 0
    if (!hasCostAssignmentsForState) {
      // We don't have cost assignments for this state. Copy them over from state code '*'
      const defaultCostAssignments = this.pristineAssignments.costAssignments.filter((item) => item.state === this.DEFAULT_STATE_CODE)
      const stateCodeAssignments = defaultCostAssignments.map((item) => {
        var clonedItem = JSON.parse(JSON.stringify(item)) // Trying to move away from angular.copy
        clonedItem.state = stateCode
        return clonedItem
      })
      this.pristineAssignments.costAssignments = this.pristineAssignments.costAssignments.concat(stateCodeAssignments)
    }
  }

  definePriceBookForSelectedState () {
    // First ensure that we have pristine assignments for the given state code
    this.ensurePristineCostAssignmentsForState(this.selectedStateForStrategy)

    // Build a map of cost assignment ids to objects
    var itemIdToCostAssignment = {}
    var itemDetailIdToDetailAssignment = {}
    const costAssignmentsForState = this.pristineAssignments.costAssignments.filter((item) => item.state === this.selectedStateForStrategy)
    costAssignmentsForState.forEach((costAssignment) => {
      itemIdToCostAssignment[costAssignment.itemId] = costAssignment
    })

    // Build a map of detail assignment ids to objects
    this.pristineAssignments.detailAssignments.forEach((detailAssignment) => {
      itemDetailIdToDetailAssignment[detailAssignment.itemDetailId] = detailAssignment
    })

    // Build the pricebookdefinitions
    this.structuredPriceBookDefinitions = []
    Object.keys(this.priceBookDefinitions).forEach((definitionKey) => {
      var definitionItems = this.priceBookDefinitions[definitionKey]
      var definition = {
        id: definitionKey,
        description: definitionKey,
        items: []
      }
      definitionItems.forEach((definitionItem) => {
        // If this item id is in cost assignments, add it
        var item = {
          id: definitionItem.id,
          description: definitionItem.description,
          unitOfMeasure: definitionItem.unitOfMeasure,
          costAssignment: itemIdToCostAssignment[definitionItem.id],
          cableConstructionType: definitionItem.cableConstructionType,
          subItems: []
        }
        definitionItem.subItems.forEach((subItem) => {
          var subItemToPush = {
            id: subItem.id,
            item: subItem.item,
            detailType: subItem.detailType
          }
          if (subItem.detailType === 'reference') {
            subItemToPush.detailAssignment = itemDetailIdToDetailAssignment[subItem.id]
          } else if (subItem.detailType === 'value') {
            subItemToPush.costAssignment = itemIdToCostAssignment[subItem.item.id]
          }
          item.subItems.push(subItemToPush)
        })
        definition.items.push(item)
      })
      this.structuredPriceBookDefinitions.push(definition)
    })
  }

  getTotalFiberInstallCost () {
    const fiberLaborList = this.structuredPriceBookDefinitions.filter(item => item.id === 'fiberLaborList')[0]
    var totalInstallCost = 0
    fiberLaborList.items.forEach(item => {
      const ratioItem = this.constructionRatios[this.selectedStateForStrategy].constructionRatios.cableConstructionRatios[item.cableConstructionType]
      const ratio = ratioItem ? (ratioItem.ratio || 0.0) : 0.0
      const cost = item.costAssignment.cost || 0.0
      totalInstallCost += (cost * ratio)
    })
    return totalInstallCost
  }

  shouldShowPercentageError () {
    const fiberLaborList = this.structuredPriceBookDefinitions.filter(item => item.id === 'fiberLaborList')[0]
    var totalInstallPercentage = 0
    fiberLaborList.items.forEach(item => {
      const ratioItem = this.constructionRatios[this.selectedStateForStrategy].constructionRatios.cableConstructionRatios[item.cableConstructionType]
      const ratio = ratioItem ? (ratioItem.ratio || 0.0) : 0.0
      totalInstallPercentage += ratio
    })
    return Math.abs(1.0 - totalInstallPercentage) > 0.001 // Total percentage should be 100%
  }

  saveAssignmentsToServer () {
    // Build a map of cost assignment ids to their index within the array
    var assignments = JSON.parse(JSON.stringify(this.pristineAssignments))
    var itemIdToCostAssignmentIndex = {}
    var itemDetailIdToDetailAssignmentIndex = {}
    assignments.costAssignments.forEach((costAssignment, index) => {
      itemIdToCostAssignmentIndex[`${costAssignment.itemId}_${costAssignment.state}`] = index
    })

    // Build a map of detail assignment ids to their index within the array
    assignments.detailAssignments.forEach((detailAssignment, index) => {
      itemDetailIdToDetailAssignmentIndex[detailAssignment.itemDetailId] = index
    })

    // Loop through the pricebook definitions
    this.structuredPriceBookDefinitions.forEach((priceBookDefinition) => {
      // Loop through items in this definition
      priceBookDefinition.items.forEach((item) => {
        if (item.costAssignment) {
          // Item has a cost assignment. Save it.
          var costAssignmentIndex = itemIdToCostAssignmentIndex[`${item.id}_${item.state}`]
          assignments.costAssignments[costAssignmentIndex] = item.costAssignment
        }
        // Loop through all subitems
        item.subItems.forEach((subItem) => {
          if (subItem.costAssignment) {
            // Sub item has a cost assignment. Save it.
            var costAssignmentIndex = itemIdToCostAssignmentIndex[`${subItem.item.id}_${subItem.state}`]
            assignments.costAssignments[costAssignmentIndex] = subItem.costAssignment
          }
          if (subItem.detailAssignment) {
            // Sub item has a detail assignment. Save it.
            var detailAssignmentIndex = itemDetailIdToDetailAssignmentIndex[subItem.id]
            assignments.detailAssignments[detailAssignmentIndex] = subItem.detailAssignment
          }
        })
      })
    })
    // Save cable construction ratios. Convert back from keyed to array
    assignments.constructionRatios = []
    Object.keys(this.constructionRatios).forEach(constructionRatioKey => {
      var constructionRatio = angular.copy(this.constructionRatios[constructionRatioKey])
      var cableConstructionRatios = []
      Object.keys(constructionRatio.constructionRatios.cableConstructionRatios).forEach(ratioKey => {
        cableConstructionRatios.push(constructionRatio.constructionRatios.cableConstructionRatios[ratioKey])
      })
      constructionRatio.constructionRatios.cableConstructionRatios = cableConstructionRatios
      assignments.constructionRatios.push(constructionRatio)
    })

    // Save assignments to the server
    this.$http.put(`/service/v1/pricebook/${this.priceBookId}/assignment`, assignments)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
  }

  exitEditingMode () {
    this.setEditingMode({ mode: this.listMode })
  }
}

PriceBookEditorController.$inject = ['$http', '$timeout']

let pricebookEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/pricebook-editor.html',
  bindings: {
    priceBookId: '<',
    listMode: '<',
    setEditingMode: '&'
  },
  controller: PriceBookEditorController
}

export default pricebookEditor
