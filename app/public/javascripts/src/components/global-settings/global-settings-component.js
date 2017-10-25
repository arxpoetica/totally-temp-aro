class GlobalSettingsController {

  constructor(state) {
    this.state = state

    this.views = Object.freeze({
      Global_Settings: 0,
      My_Account: 1,
      Manage_Users: 2
    })
    this.currentView = this.views.Global_Settings
  }

  modalShown() {
    this.state.showGlobalSettings.next(true)
  }

  modalHide() {
    this.state.showGlobalSettings.next(false)
  }
  
  toggleViewMode() {
    this.currentView = this.views.Global_Settings
  }

  toggleMyAccountMode() {
    this.currentView = this.views.My_Account
  }

  toggleManageUsersMode() {
    this.currentView = this.views.Manage_Users
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

        <div id="global-settings" ng-if="$ctrl.currentView === $ctrl.views.Global_Settings">  
          <button class="btn settings-btn"
            ng-click="$ctrl.toggleMyAccountMode()">
              <i class="fa fa-2x fa-user"></i>
              <br>My Account
          </button>

          <button class="btn settings-btn"
            ng-click="$ctrl.toggleManageUsersMode()">
              <i class="fa fa-2x fa-users"></i>
              <br>Manage Users
          </button>
        </div>

        <user-account-settings ng-if="$ctrl.currentView === $ctrl.views.My_Account" 
          toggle-view="$ctrl.toggleViewMode()"></user-account-settings>

        <manage-users ng-if="$ctrl.currentView === $ctrl.views.Manage_Users" 
          toggle-view="$ctrl.toggleViewMode()"></manage-users>  

      </modal-body>
    </modal>
  `,
  bindings: {},
  controller: GlobalSettingsController
})

