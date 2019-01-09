class RateReachDistanceEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.isCategoryInEditMode = {}  // For each category hold a flag that tells us if it is being edited
  }

  addCategory() {
    // Add a new category and also add placeholder values for the categories
    const MAX_ID = Math.max.apply(Math, this.categories.map(item => item.id))
    const newCategory = {
      id: MAX_ID + 1,
      name: 'New category',
      description: 'New category'
    }
    this.categories.push(newCategory)
    Object.keys(this.rateReachGroupMap).forEach(technology => {
      Object.keys(this.rateReachGroupMap[technology].matrixInMetersMap).forEach(technologyRef => {
        this.rateReachGroupMap[technology].matrixInMetersMap[technologyRef].push(1000)
      })
    })
  }

  removeCategory(category) {
    const categoryIndex = this.categories.findIndex(item => item.id === category.id)
    this.categories.splice(categoryIndex, 1)
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
    rateReachGroupMap: '=',
    technologies: '<',
    selectedTechnologyType: '<',
    allowEditableCategories: '<'
  },
  controller: RateReachDistanceEditorController
}

export default rateReachEditor