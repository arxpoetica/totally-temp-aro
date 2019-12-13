import Constants from '../../common/constants'

class PlanSettingsController {
  constructor ($http, state, $timeout, $ngRedux, tracker) {
    this.$http = $http
    this.state = state
    this.currentUser = state.loggedInUser
    this.$timeout = $timeout
    this.isSaveEnabled = false
    this.errorText = ''

    tracker.trackEvent(tracker.CATEGORIES.ENTER_PLAN_SETTINGS_MODE, tracker.ACTIONS.CLICK)
    this.childSettingsPanels = {}
    this.resetChildSettingsPanels()
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    this.childSettingsPanels.dataSelection.isChanged = !angular.equals(this.dataItems, this.state.pristineDataItems)
    this.childSettingsPanels.resourceSelection.isChanged = !angular.equals(this.state.resourceItems, this.state.pristineResourceItems)
    this.childSettingsPanels.networkConfiguration.isChanged = !angular.equals(this.state.networkConfigurations, this.state.pristineNetworkConfigurations)

    this.updateUIState()
  }

  areControlsEnabled () {
    return (this.state.plan.planState === Constants.PLAN_STATE.START_STATE) || (this.state.plan.planState === Constants.PLAN_STATE.INITIALIZED)
  }

  resetChildSettingsPanels (childKey) {
    if (typeof childKey === 'undefined') {
      // if no child key, reset all
      this.childSettingsPanels = {
        dataSelection: {
          displayName: 'Data Selection',
          isChanged: false,
          isValid: true
        },
        resourceSelection: {
          displayName: 'Resource Selection',
          isChanged: false,
          isValid: true
        },
        networkConfiguration: {
          displayName: 'Network Configuration',
          isChanged: false,
          isValid: true
        }
      }
    } else {
      // if child key, reset only that one
      if (!this.childSettingsPanels.hasOwnProperty(childKey)) return
      this.childSettingsPanels[childKey].isChanged = false
      this.childSettingsPanels[childKey].isValid = true
    }
  }

  onChange (args) {
    if (!args.hasOwnProperty('childKey')) return
    var childKey = args.childKey
    var isValid = true
    if (args.hasOwnProperty('isValid')) isValid = args.isValid
    var isInit = false
    if (args.hasOwnProperty('isInit')) isInit = args.isInit

    if (this.childSettingsPanels.hasOwnProperty(childKey)) {
      if (!isInit) this.childSettingsPanels[childKey].isChanged = true
      this.childSettingsPanels[childKey].isValid = isValid

      this.updateUIState()
    }
  }

  updateUIState () {
    // update buttons and error list
    var childData = this.getChangeList()

    this.isSaveEnabled = (childData.changesList.length > 0)

    if (childData.invalidList.length > 0) {
      this.isSaveEnabled = false
      var errorText = this.childListToText(childData.invalidList)
      this.errorText = 'Invalid selections for ' + errorText + '.'
    } else {
      this.errorText = ''
    }
  }

  saveChanges () {
    if (!this.isSaveEnabled) return
    this.isSaveEnabled = false
    // for each child save and on success rest the object
    if (this.childSettingsPanels.dataSelection.isChanged && this.childSettingsPanels.dataSelection.isValid) {
      this.saveDataSelectionToServer()
      this.resetChildSettingsPanels('dataSelection')
      // Clear the selected Service area when modify the optimization
      this.clearAllSelectedSA()
    }

    if (this.childSettingsPanels.resourceSelection.isChanged && this.childSettingsPanels.resourceSelection.isValid) {
      this.state.savePlanResourceSelectionToServer()
      this.resetChildSettingsPanels('resourceSelection')
    }

    if (this.childSettingsPanels.networkConfiguration.isChanged && this.childSettingsPanels.networkConfiguration.isValid) {
      this.state.saveNetworkConfigurationToDefaultProject()
      this.resetChildSettingsPanels('networkConfiguration')
    }
  }

  // Saves the plan Data Selection configuration to the server
  saveDataSelectionToServer () {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(this.dataItems).forEach(dataItemKey => {
      // An example of dataItemKey is 'location'
      if (this.dataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: this.dataItems[dataItemKey].selectedLibraryItems
        }
        putBody.configurationItems.push(configurationItem)
      }
    })

    // Save the configuration to the server
    this.$http.put(`/service/v1/plan/${this.planId}/configuration`, putBody)
  }

  discardChanges () {
    this.isSaveEnabled = false
    this.resetChildSettingsPanels()

    this.state.networkConfigurations = angular.copy(this.state.pristineNetworkConfigurations)
    this.state.resourceItems = angular.copy(this.state.pristineResourceItems)
  }

  clearAllSelectedSA () {
    var plan = this.state.plan

    this.$http.delete(`/service_areas/${plan.id}/removeAllServiceAreaTargets`, { })
      .then(() => {
        this.state.reloadSelectedServiceAreas()
        return Promise.resolve()
      })
  }

  getChangeList () {
    var changesList = []
    var invalidList = []

    for (var childKey in this.childSettingsPanels) {
      if (this.childSettingsPanels[childKey].isChanged) changesList.push(this.childSettingsPanels[childKey])
      if (!this.childSettingsPanels[childKey].isValid) invalidList.push(this.childSettingsPanels[childKey])
    }

    return { changesList: changesList, invalidList: invalidList }
  }

  childListToText (list) {
    var text = ''
    for (var i = 0; i < list.length; i++) {
      if (i != 0 && list.length > 2) text += ', '
      if (list.length > 1 && list.length - 1 == i) text += ' and '
      text += list[i].displayName
    }

    return text
  }

  $onDestroy () {
    // If any selections have been changed, ask the user if they want to save them

    var childData = this.getChangeList()

    var changesList = childData.changesList
    var invalidList = childData.invalidList

    if (changesList.length > 0) {
      if (invalidList.length == 0) {
        var saveText = this.childListToText(changesList)

        swal({
          title: 'Save modified settings?',
          text: 'Do you want to save your changes to ' + saveText + '?',
          type: 'warning',
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Save', // 'Yes',
          showCancelButton: true,
          cancelButtonText: 'Keep Unsaved', // 'No',
          closeOnConfirm: true
        }, (result) => {
          if (result) {
            this.saveChanges()
          } else {
            // this.discardChanges()
          }
        })
      } else {
        // All selections are not valid
        var errorText = this.childListToText(invalidList)
        swal({
          title: 'Invalid selections',
          text: 'The data selections are not valid for ' + errorText + '. Correct them before trying to save your changes.',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: '#DD6B55'
        })
      }
    }
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems,
      planId: reduxState.plan.activePlan.id
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems))
    }
  }
}

PlanSettingsController.$inject = ['$http', 'state', '$timeout', '$ngRedux', 'tracker']

let planSettings = {
  templateUrl: '/components/sidebar/plan-settings/plan-settings.html',
  controller: PlanSettingsController
}

export default planSettings
