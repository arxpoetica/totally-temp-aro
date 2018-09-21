class PriceBookCreatorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.priceStrategies = []
    this.newPriceBookName = 'New PriceBook'
    this.newPriceBookDescription = 'New PriceBook Description'
    this.sourcePriceBook = null
  }

  $onInit() {
    this.selectedPriceStrategy = null
    var clonedPricebookPromise = this.sourcePriceBookId ? this.$http.get(`/service/v1/pricebook/${this.sourcePriceBookId}`) : Promise.resolve()
    Promise.all([this.$http.get('/service/v1/pricebook-strategies'), clonedPricebookPromise])
      .then((results) => {
        this.priceStrategies = results[0].data
        if (this.sourcePriceBookId) {
          // We are cloning an existing pricebook. Set this as the selected price strategy
          this.sourcePriceBook = results[1].data
          this.selectedPriceStrategy = this.priceStrategies.filter((item) => item.name === this.sourcePriceBook.priceStrategy)[0]
        } else {
          // We are creating a new pricebook. Use the first price strategy
          this.selectedPriceStrategy = this.priceStrategies[0]
        }
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  createPriceBook() {
    // Create a new pricebook with the specified name and description
    var createdManagerId = null
    return this.$http.post('/service/v1/pricebook', { name: this.newPriceBookName, description: this.newPriceBookDescription, priceStrategy: this.selectedPriceStrategy.name })
      .then((result) => {
        createdManagerId = result.data.id
        // Return the assignments of either the 0th pricebook (if creating a new one) or the source pricebook (if cloning)
        if (this.sourcePriceBookId) {
          return this.$http.get(`/service/v1/pricebook/${this.sourcePriceBookId}/assignment`)
        } else {
          return this.$http.get('/service/v1/pricebook')
            .then((result) => this.$http.get(`/service/v1/pricebook/${result.data[0].id}/assignment`))
        }
      })
      .then((result) => {
        var newManagerAssignments = result.data
        // IF we are creating a blank pricebook, take the assignments of the default manager,
        // set all values to 0 and then assign that to the newly created manager
        if (!this.sourcePriceBookId) {
          newManagerAssignments.costAssignments.forEach((costAssignment) => {
            costAssignment.state = '*'
            costAssignment.cost = 0
          })
          newManagerAssignments.detailAssignments.forEach((detailAssignment) => {
            detailAssignment.quantity = 0
            detailAssignment.ratioFixed = 1
          })
        }
        return this.$http.put(`/service/v1/pricebook/${createdManagerId}/assignment`, newManagerAssignments)
      })
      .then(() => {
        this.onManagersChanged && this.onManagersChanged()
        this.setEditingMode && this.setEditingMode({ mode: this.listMode })
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  closeDialog() {
    this.setEditingMode && this.setEditingMode({ mode: this.listMode })
  }
}

PriceBookCreatorController.$inject = ['$http', '$timeout', 'state']

let priceBookCreator = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/pricebook-creator.html',
  bindings: {
    sourcePriceBookId: '<',
    onManagersChanged: '&',
    listMode: '<',
    setEditingMode: '&',
  },
  controller: PriceBookCreatorController
}

export default priceBookCreator