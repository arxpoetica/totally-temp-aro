class RateReachDistanceEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.isCategoryInEditMode = []  // For each category hold a flag that tells us if it is being edited
  }

  $onChanges(changesObj) {
    if (changesObj.categories) {
      this.isCategoryInEditMode = []
      changesObj.categories.forEach(item => this.isCategoryInEditMode.push(false))
    }
  }

  addCategory() {
    // Add a new category and also add placeholder values for the categories
    const newCategory = {
      name: 'New category',
      description: 'New category'
    }
    this.categories.push(newCategory)
    Object.keys(this.rateReachGroupMap).forEach(technology => {
      Object.keys(this.rateReachGroupMap[technology].matrixInMetersMap).forEach(technologyRef => {
        this.rateReachGroupMap[technology].matrixInMetersMap[technologyRef].push(0)
      })
    })
  }

  removeCategory(category) {
    const categoryIndex = this.categories.findIndex(item => item.id === category.id)
    this.categories.splice(categoryIndex, 1)
    this.isCategoryInEditMode.splice(categoryIndex, 1)
    Object.keys(this.rateReachGroupMap).forEach(technology => {
      Object.keys(this.rateReachGroupMap[technology].matrixInMetersMap).forEach(technologyRef => {
        this.rateReachGroupMap[technology].matrixInMetersMap[technologyRef].splice(categoryIndex, 1)
      })
    })
  }
}

RateReachDistanceEditorController.$inject = ['$http', '$timeout', 'state']

let rateReachEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-distance-editor.html',
  bindings: {
    categories: '=',
    categoryDescription: '<',
    rateReachGroupMap: '=',
    technologies: '<',
    selectedTechnologyType: '<',
    allowEditableCategories: '<'
  },
  controller: RateReachDistanceEditorController
}

export default rateReachEditor