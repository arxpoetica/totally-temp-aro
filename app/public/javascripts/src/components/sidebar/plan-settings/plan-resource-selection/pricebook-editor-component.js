class PriceBookEditorController {
  constructor($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.priceBookDefinitions = []
    this.pristineAssignments = []
  }

  $onChanges(changesObj) {
    if (changesObj.priceBookId) {
      this.rebuildPricebookDefinitions()
    }
  }

  rebuildPricebookDefinitions() {
    if (!this.priceBookId) {
      return
    }
    Promise.all([
      this.$http.get(`/service/v1/pricebook/${this.priceBookId}/definition`),
      this.$http.get(`/service/v1/pricebook/${this.priceBookId}/assignment`)
    ])
    .then((results) => {
      var definitionResult = results[0].data
      var assignmentResult = results[1].data
      // Save a deep copy of the result, we can use this later if we save modifications to the server
      this.pristineAssignments = angular.copy(assignmentResult)

      // Build a map of cost assignment ids to objects
      var itemIdToCostAssignment = {}
      var itemDetailIdToDetailAssignment = {}
      assignmentResult.costAssignments.forEach((costAssignment) => {
        itemIdToCostAssignment[costAssignment.itemId] = costAssignment
      })

      // Build a map of detail assignment ids to objects
      assignmentResult.detailAssignments.forEach((detailAssignment) => {
        itemDetailIdToDetailAssignment[detailAssignment.itemDetailId] = detailAssignment
      })

      // Build the pricebookdefinitions
      this.priceBookDefinitions = []
      Object.keys(definitionResult).forEach((definitionKey) => {
        var definitionItems = definitionResult[definitionKey]
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
        this.priceBookDefinitions.push(definition)
      })
      this.$timeout()
      console.log(this.priceBookDefinitions)
    })
    .catch((err) => console.log(err))
  }

  saveAssignmentsToServer() {

    // Build a map of cost assignment ids to their index within the array
    var assignments = angular.copy(this.pristineAssignments)
    var itemIdToCostAssignmentIndex = {}
    var itemDetailIdToDetailAssignmentIndex = {}
    assignments.costAssignments.forEach((costAssignment, index) => {
      itemIdToCostAssignmentIndex[costAssignment.itemId] = index
    })

    // Build a map of detail assignment ids to their index within the array
    assignments.detailAssignments.forEach((detailAssignment, index) => {
      itemDetailIdToDetailAssignmentIndex[detailAssignment.itemDetailId] = index
    })

    // Loop through the pricebook definitions
    this.priceBookDefinitions.forEach((priceBookDefinition) => {

      // Loop through items in this definition
      priceBookDefinition.items.forEach((item) => {
        if (item.costAssignment) {
          // Item has a cost assignment. Save it.
          var costAssignmentIndex = itemIdToCostAssignmentIndex[item.id]
          assignments.costAssignments[costAssignmentIndex] = item.costAssignment
        }
        // Loop through all subitems
        item.subItems.forEach((subItem) => {
          if (subItem.costAssignment) {
            // Sub item has a cost assignment. Save it.
            var costAssignmentIndex = itemIdToCostAssignmentIndex[subItem.item.id]
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
    // Save assignments to the server
    this.$http.put(`/service/v1/pricebook/${this.priceBookId}/assignment`, assignments)
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

PriceBookEditorController.$inject = ['$http', '$timeout']

app.component('pricebookEditor', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/pricebook-editor-component.html',
  bindings: {
    priceBookId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: PriceBookEditorController
})