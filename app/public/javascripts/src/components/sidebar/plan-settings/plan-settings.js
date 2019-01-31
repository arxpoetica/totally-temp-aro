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
    this.errorText = ""
    
    tracker.trackEvent(tracker.CATEGORIES.ENTER_PLAN_SETTINGS_MODE, tracker.ACTIONS.CLICK)
    
    state.plan.subscribe((newPlan) => {
      this.plan = newPlan
      this.setControlsEnabled(newPlan)
    })

    state.planOptimization.subscribe((newPlan) => {
      this.setControlsEnabled(newPlan)
    })
    
    this.childSettingsPanels = {}
    this.resetChildSettingsPanels()
    
  }
  
  $onInit() {
    this.childSettingsPanels.dataSelection.isChanged = !angular.equals(this.state.dataItems, this.state.pristineDataItems)
    this.childSettingsPanels.resourceSelection.isChanged = !angular.equals(this.state.resourceItems, this.state.pristineResourceItems)
    this.childSettingsPanels.networkConfiguration.isChanged = !angular.equals(this.state.networkConfigurations, this.state.pristineNetworkConfigurations)
    
    this.updateUIState()
  }
  
  setControlsEnabled(newPlan){
    if (newPlan) {
      this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
    }
  }
  
  resetChildSettingsPanels(childKey){
    if ('undefined' == typeof childKey){
      // if no child key, reset all
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
      
    }else{
      // if child key, reset only that one
      if (!this.childSettingsPanels.hasOwnProperty(childKey)) return
      this.childSettingsPanels[childKey].isChanged = false
      this.childSettingsPanels[childKey].isValid = true
    } 
  }
  
  onChange(args){
    if (!args.hasOwnProperty('childKey')) return
    var childKey = args.childKey
    var isValid = true
    if (args.hasOwnProperty('isValid')) isValid = args.isValid
    var isInit = false
    if (args.hasOwnProperty('isInit')) isInit = args.isInit
    
    if (this.childSettingsPanels.hasOwnProperty(childKey)){
      if (!isInit) this.childSettingsPanels[childKey].isChanged = true
      this.childSettingsPanels[childKey].isValid = isValid
      
      this.updateUIState()
    }
  }
  
  updateUIState(){
    // update buttons and error list
    var childData = this.getChangeList()
    
    this.isSaveEnabled = (0 < childData.changesList.length)
    
    if (0 < childData.invalidList.length){
      this.isSaveEnabled = false
      var errorText = this.childListToText(childData.invalidList)
      this.errorText = "Invalid selections for "+errorText+"."
    }else{
      this.errorText = ""
    }
  }
  
  saveChanges(){
    if (!this.isSaveEnabled) return
    this.isSaveEnabled = false
    //for each child save and on success rest the object
    if (this.childSettingsPanels.dataSelection.isChanged && this.childSettingsPanels.dataSelection.isValid){
      this.state.saveDataSelectionToServer()
      this.resetChildSettingsPanels('dataSelection')
      //Clear the selected Service area when modify the optimization
      this.clearAllSelectedSA()
    }
    
    if (this.childSettingsPanels.resourceSelection.isChanged && this.childSettingsPanels.resourceSelection.isValid){
      this.state.savePlanResourceSelectionToServer()
      this.resetChildSettingsPanels('resourceSelection')
    }
    
    if (this.childSettingsPanels.networkConfiguration.isChanged && this.childSettingsPanels.networkConfiguration.isValid){
      this.state.saveNetworkConfigurationToDefaultProject()
      this.resetChildSettingsPanels('networkConfiguration')
    }
    
  }
  
  discardChanges(){
    this.isSaveEnabled = false
    this.resetChildSettingsPanels()
    
    this.state.networkConfigurations = angular.copy(this.state.pristineNetworkConfigurations)
    this.state.resourceItems = angular.copy(this.state.pristineResourceItems)
    
    this.state.dataItems = angular.copy(this.state.pristineDataItems)
    this.state.dataItemsChanged.next(this.state.dataItems)
    
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
          confirmButtonText: 'Save', //'Yes',
          showCancelButton: true,
          cancelButtonText: 'Keep Unsaved', //'No',
          closeOnConfirm: true
        }, (result) => {
          if (result) { 
            this.saveChanges()
          }else{
            //this.discardChanges()
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