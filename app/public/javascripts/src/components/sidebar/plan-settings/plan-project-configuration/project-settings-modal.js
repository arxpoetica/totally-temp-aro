class ProjectSettingsController {
  constructor ($http, $ngRedux, state) {
    this.state = state
    this.$http = $http
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }
 
  modalShown () {
    this.state.showProjectSettingsModal.next(true)
  }

  modalHide () {
    this.state.showProjectSettingsModal.next(false)
  }
 
  mapStateToThis (reduxState) {
    return {
      activeProjectId: reduxState.projectTemplate.selectedProjectTemplateId
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

ProjectSettingsController.$inject = ['$http', '$ngRedux', 'state']

let projectSettingsModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-project-configuration/project-settings-modal.html',
  bindings: {},
  controller: ProjectSettingsController
}

export default projectSettingsModal
