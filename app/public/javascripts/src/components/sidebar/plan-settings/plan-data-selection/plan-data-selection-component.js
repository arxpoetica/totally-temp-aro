class DataSelectionController {
  constructor() {
  }
}

// Component did not work when it was called 'dataSelection'
app.component('planDataSelection', {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/plan-data-selection-component.html',
  controller: DataSelectionController
})