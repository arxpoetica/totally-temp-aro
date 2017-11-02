class GlobalSettingsController {

  constructor(state) {
    this.state = state
    this.isGlobalSettingsView = true
  }

  modalShown() {
    this.state.showGlobalSettings.next(true)
  }

  modalHide() {
    this.state.showGlobalSettings.next(false)
  }
  
  toggleViewMode() {
    this.isGlobalSettingsView = !this.isGlobalSettingsView
  }

  manageUsers() {
    // Show the old dialog for now. When this component is done, the old dialog will be migrated to this one.
    this.state.showGlobalSettings.next(false);
    $('#manage-users').modal('show');
    console.log('done');
  }
}

GlobalSettingsController.$inject = ['state']

app.component('globalSettings', {
  template: `
  <style scoped>
  #global-settings {
    display: flex;
    min-height: 100%;
    flex-wrap: wrap
  }
  .settings-btn {
    width: calc(33.33333% - 20px);
    margin: 10px
  }
  </style>
    <modal visible="$ctrl.state.showGlobalSettings.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
      <modal-header title="Global Settings"></modal-header>
      <modal-body>

        <div id="global-settings" ng-if="$ctrl.isGlobalSettingsView">  
          <button class="btn settings-btn"
            ng-click="$ctrl.toggleViewMode()">
              <i class="fa fa-2x fa-user"></i>
              <br>My Account
          </button>

          <button class="btn settings-btn"
                  ng-click="$ctrl.manageUsers()">
              <i class="fa fa-2x fa-users"></i>
              <br>Manage Users
          </button>
        </div>

        <user-account-settings ng-if="!$ctrl.isGlobalSettingsView" 
          toggle-view="$ctrl.toggleViewMode()"></user-account-settings>

      </modal-body>
    </modal>
  `,
  bindings: {},
  controller: GlobalSettingsController
})

