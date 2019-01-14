class SpeedCategory {
  constructor(speed, units) {
    this.speed = speed
    this.units = units
  }

  toServiceCategory() {
    // Format the category in aro-service format
    const label = `${this.speed} ${this.units}`
    return {
      name: label,
      description: label
    }
  }

  static fromServiceCategory(serviceCategory) {
    // Create a SpeedCategory object from an aro-service object formatted using the SpeedCategory.toServiceCategory() object
    if (serviceCategory.name !== serviceCategory.description) {
      console.warn('Service category name and description are different. They should be the same. Attempting to continue with name...')
    }
    const parts = serviceCategory.name.split(' ')
    if (parts.length !== 2) {
      console.warn(`Expecting exactly 2 parts after splitting service category name, got ${parts.length}. Attempting to continue...`)
    }
    if (parts[1] !== 'Mbps' && parts[1] !== 'Gbps') {
      console.warn('Category units should be Mbps or Gbps')
    }
    return new SpeedCategory(+parts[0], parts[1])
  }
}

class RateReachDistanceEditorController {
  constructor($element, $http, $timeout, state) {
    this.$element = $element
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.isCategoryInEditMode = []  // For each category hold a flag that tells us if it is being edited
    this.editableCategories = []    // For each category, we have a "editable" category that we can copy back-and-forth
  }

  $onInit() {
    // Use JQuery-UI Sortable to allow the table rows to be sorted using drag-and-drop
    const sortableBody = this.$element.find('#rateReachDistanceEditorSortableBody')
    sortableBody.sortable({
      handle: '.row-draggable-handle',
      stop: this.handleSortOrderChanged.bind(this)
    });
    sortableBody.disableSelection();
  }

  handleSortOrderChanged(event, ui) {
    // The JQuery UI "sortable" widget has sorted the <tr> with the category, but our model has not updated.
    // We will loop through the <tr>'s in the DOM and create a new model array with the new order, and then 
    // force angularjs to re-bind to our new model array.
    const newCategories = []
    const tableRows = this.$element.find('#rateReachDistanceEditorSortableBody tr')
    for (var iRow = 0; iRow < tableRows.length; ++iRow) {
      // The element ID contains the old index of the category
      const rowId = tableRows[iRow].id
      const oldIndex = +rowId.substring(rowId.lastIndexOf('_') + 1)
      newCategories[iRow] = this.categories[oldIndex]
    }
    this.categories = newCategories
    this.$timeout()
  }

  $doCheck() {
    if (this.oldCategories !== this.categories) {
      this.oldCategories = this.categories
      this.isCategoryInEditMode = []
      this.editableCategories = []
      this.categories.forEach(category => {
        this.isCategoryInEditMode.push(false)
        this.editableCategories.push((this.categoryType === 'SPEED') ? SpeedCategory.fromServiceCategory(category) : category)
      })
    }
  }

  addCategory() {
    // Add a new category and also add placeholder values for the categories
    var newCategory = null
    if (this.categoryType === 'SPEED') {
      newCategory = new SpeedCategory(1, 'Mbps')
      this.categories.push(newCategory.toServiceCategory())
    } else {
      newCategory = {
        name: 'New category',
        description: 'New category'
      }
      this.categories.push(newCategory)
    }
    this.editableCategories.push(newCategory)
    Object.keys(this.rateReachGroupMap).forEach(technology => {
      Object.keys(this.rateReachGroupMap[technology].matrixMap).forEach(technologyRef => {
        this.rateReachGroupMap[technology].matrixMap[technologyRef].push({
          distance: 0,
          speed: 1
        })
      })
    })
  }

  removeCategory(category) {
    const categoryIndex = this.categories.findIndex(item => item.id === category.id)
    this.categories.splice(categoryIndex, 1)
    this.isCategoryInEditMode.splice(categoryIndex, 1)
    Object.keys(this.rateReachGroupMap).forEach(technology => {
      Object.keys(this.rateReachGroupMap[technology].matrixMap).forEach(technologyRef => {
        this.rateReachGroupMap[technology].matrixMap[technologyRef].splice(categoryIndex, 1)
      })
    })
  }

  saveCategory(index) {
    // Copies over the "editable" category onto the service-formatted category
    if (this.categoryType === 'SPEED') {
      this.categories[index] = this.editableCategories[index].toServiceCategory()
      // We should also copy over the speeds to all the distance/speed maps
      const multiplier = this.editableCategories[index].units === 'Gbps' ? 1000 : 1
      const speedMbps = this.editableCategories[index].speed * multiplier
      Object.keys(this.rateReachGroupMap).forEach(technology => {
        Object.keys(this.rateReachGroupMap[technology].matrixMap).forEach(technologyRef => {
          this.rateReachGroupMap[technology].matrixMap[technologyRef].forEach(distanceSpeedPair => {
            distanceSpeedPair.speed = speedMbps
          })
        })
      })  
    } else {
      this.categories[index] = this.editableCategories[index]
      // No need to copy over the speeds to the distance/speed maps
    }
    this.isCategoryInEditMode[index] = false
  }
}

RateReachDistanceEditorController.$inject = ['$element', '$http', '$timeout', 'state']

let rateReachEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-distance-editor.html',
  bindings: {
    categoryType: '<',
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