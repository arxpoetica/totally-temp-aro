class UserAccountSettingsController {

  constructor($scope, $http, state) {
    this.state = state
    this.$http = $http
    this.user = globalUser
    this.form = $('#applicationUserSettings form').get(0)
  }

  save() {
    var formData = new FormData(this.form)
    var data = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      old_password: formData.get('old_password'),
      password: formData.get('password'),
      password_confirm: formData.get('password_confirm')
    }
    this.$http({
      method: 'POST',
      url: '/settings/update_settings',
      data: data
    }).then((response) => {
      this.success = response.data.success
      this.state.showGlobalSettings.next(false)
    }).catch((response) => {
      this.error = response.data.error
      this.state.showGlobalSettings.next(false)
    })

  }

}

UserAccountSettingsController.$inject = ['$scope', '$http', 'state']

app.component('userAccountSettings', {
  templateUrl: '/components/global-settings/user-account-settings-component.html',
  bindings: {
    toggleView: '&'
  },
  controller: UserAccountSettingsController
})

