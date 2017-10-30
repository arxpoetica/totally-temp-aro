class PriceBookEditorController {
  constructor($http) {
    this.$http = $http
    this.priceBookDefinitions = []
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
          definitionItem.costAssignment = itemIdToCostAssignment[definitionItem.id] // This can be 'undefined'
          definitionItem.subItems.forEach((subItem) => {
            subItem.detailAssignment = itemDetailIdToDetailAssignment[subItem.id]
          })
          definition.items.push(definitionItem)
        })
        this.priceBookDefinitions.push(definition)
      })
      console.log(this.priceBookDefinitions)
    })
    .catch((err) => console.log(err))
  }
}

PriceBookEditorController.$inject = ['$http']

app.component('pricebookEditor', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/pricebook-editor-component.html',
  bindings: {
    priceBookId: '<'
  },
  controller: PriceBookEditorController
})