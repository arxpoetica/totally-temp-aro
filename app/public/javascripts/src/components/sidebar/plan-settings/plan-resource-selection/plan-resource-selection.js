
class ResourceSelectionController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    //this.pristineResourceItems = angular.copy(this.state.resourceItems)
    //this.isDirty = false
  }
  
  /*
  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (!angular.equals(this.state.resourceItems, this.pristineResourceItems)) {
      swal({
        title: 'Save modified settings?',
        text: 'You have changed the resource selection settings. Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          // Save the changed settings to aro-service
          this.state.savePlanResourceSelectionToServer()
        }
        this.isDirty = false  // Technically not required since we are in $onDestroy
      })
    }
  }
  */
  
  onSelectionChanged() {
    this.onChange({childKey:this.key, isValid:true})
  }
  
}

ResourceSelectionController.$inject = ['$http', '$timeout', 'state']

// Component did not work when it was called 'dataSelection'
let planResourceSelection = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-selection.html',
  bindings: {
    userId: '<',
    planId: '<', 
    key: '<', 
    onChange: '&'
  },
  controller: ResourceSelectionController
}

export default planResourceSelection