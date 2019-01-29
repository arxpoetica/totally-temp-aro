import Constants from '../../common/constants'

class PlanSettingsController {
  constructor($scope, $http, state, $timeout, tracker) {
    this.$http = $http
    this.plan = {}
    this.state = state
    this.currentUser = state.loggedInUser
    this.$timeout = $timeout
    this.areControlsEnabled = true
    this.isSaveEnabled = false
    this.errorText = " "
    
    tracker.trackEvent(tracker.CATEGORIES.ENTER_PLAN_SETTINGS_MODE, tracker.ACTIONS.CLICK)
    
    state.plan.subscribe((newPlan) => {
      this.plan = newPlan
      this.setControlsEnabled(newPlan)
    })

    state.planOptimization.subscribe((newPlan) => {
      this.setControlsEnabled(newPlan)
    })
    
    this.childSettingsPanels = {
      dataSelection: {
        displayName: 'Data Selection',  
        isChanged: false, 
        isValid: true, 
      }, 
      resourceSelection: {
        displayName: 'Resource Selection',  
        isChanged: false, 
        isValid: true, 
      }, 
      networkConfiguration: {
        displayName: 'Network Configuration',  
        isChanged: false, 
        isValid: true, 
      } 
    }
    
  }
  
  
  setControlsEnabled(newPlan){
    if (newPlan) {
      this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
    }
  }
  
  onChange(args){
    if (!args.hasOwnProperty('childKey')) return
    var childKey = args.childKey
    var isValid = true
    if (args.hasOwnProperty('isValid')) isValid = args.isValid
    
    if (this.childSettingsPanels.hasOwnProperty(childKey)){
      this.childSettingsPanels[childKey].isChanged = true
      this.childSettingsPanels[childKey].isValid = isValid
      
      // update buttons and error list
      var childData = this.getChangeList()
      if (0 < childData.invalidList.length){
        this.isSaveEnabled = false
        var errorText = this.childListToText(childData.invalidList)
        this.errorText = "Invalid selections for "+errorText+"."
      }else{
        this.isSaveEnabled = true
        this.errorText = " "
      }
      
    }
    
  }
  
  saveChanges(){
    console.log('save')
    if (!this.isSaveEnabled) return
    //for each child save and on success rest the object
    if (this.childSettingsPanels.dataSelection.isChanged && this.childSettingsPanels.dataSelection.isValid){
      this.state.saveDataSelectionToServer()
      this.childSettingsPanels.dataSelection.isChanged = false
      this.childSettingsPanels.dataSelection.isValid = true
      //Clear the selected Service area when modify the optimization
      this.clearAllSelectedSA()
    }
    
    if (this.childSettingsPanels.resourceSelection.isChanged && this.childSettingsPanels.resourceSelection.isValid){
      this.state.savePlanResourceSelectionToServer()
      this.childSettingsPanels.resourceSelection.isChanged = false
      this.childSettingsPanels.resourceSelection.isValid = true
    }
    
    if (this.childSettingsPanels.networkConfiguration.isChanged && this.childSettingsPanels.networkConfiguration.isValid){
      this.state.saveNetworkConfigurationToDefaultProject()
      this.childSettingsPanels.networkConfiguration.isChanged = false
      this.childSettingsPanels.networkConfiguration.isValid = true
    }
    
    this.isSaveEnabled = false
  }
  
  discardChanges(){
    console.log('discard changes')
  }
  
  clearAllSelectedSA() {
    var plan = this.state.plan.getValue()

    this.$http.delete(`/service_areas/${plan.id}/removeAllServiceAreaTargets`, { })
    .then(() => {
      this.state.reloadSelectedServiceAreas()
      return Promise.resolve()
    })
  }
  
  getChangeList(){
    var changesList = []
    var invalidList = []
    
    for (var childKey in this.childSettingsPanels) {
      if (this.childSettingsPanels[childKey].isChanged) changesList.push(this.childSettingsPanels[childKey])
      if (!this.childSettingsPanels[childKey].isValid) invalidList.push(this.childSettingsPanels[childKey])
    }
    
    return {changesList:changesList, invalidList:invalidList}
  }
  
  childListToText(list){
    var text = ''
    for (var i = 0; i < list.length; i++) {
      if (0 != i && list.length > 2) text += ', '
      if (list.length > 1 && list.length-1 == i) text += ' and '
      text += list[i].displayName
    }
    console.log(text)
    return text
  }
  
  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    
    var childData = this.getChangeList()
    
    var changesList = childData.changesList
    var invalidList = childData.invalidList
    
    if (0 < changesList.length) {
      if (0 == invalidList.length) {
        
        var saveText = this.childListToText(changesList)
        
        swal({
          title: 'Save modified settings?',
          text: 'Do you want to save your changes to '+saveText+'?',
          type: 'warning',
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes',
          showCancelButton: true,
          cancelButtonText: 'No',
          closeOnConfirm: true
        }, (result) => {
          if (result) { 
            this.saveChanges()
          }
        })
      } else {
        // All selections are not valid
        var errorText = this.childListToText(invalidList)
        swal({
          title: 'Invalid selections',
          text: 'The data selections are not valid for '+errorText+'. Correct them before trying to save your changes.',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: '#DD6B55'
        })
      }
    }
  }
  
}

PlanSettingsController.$inject = ['$scope', '$http', 'state', '$timeout', 'tracker']

let planSettings = {
  templateUrl: '/components/sidebar/plan-settings/plan-settings.html',
  controller: PlanSettingsController
}

export default planSettings