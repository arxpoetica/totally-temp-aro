class GlobalSettingsController {

  constructor($scope, state) {
    this.state = state
    $scope.close = () => {
      //state.openGlobalSettings = false;
      state.showGlobalSettings.next(false)
    }

    $scope.modalShown = () => {
      state.showGlobalSettings.next(true)
    }

    $scope.modalHide = () => {
      state.showGlobalSettings.next(false)
    }
  }
}

GlobalSettingsController.$inject = ['$scope', 'state']

app.component('globalSettings', {
  template: `
    <modal visible="$ctrl.state.showGlobalSettings.value" backdrop="static" on-show="modalShown()" on-hide="modalHide()" >
      <modal-header title="Global Settings"></modal-header>
      <modal-body>
        <user-account-settings></user-account-settings>
      </modal-body>
    </modal>
  `,
  bindings: {},
  controller: GlobalSettingsController
})

