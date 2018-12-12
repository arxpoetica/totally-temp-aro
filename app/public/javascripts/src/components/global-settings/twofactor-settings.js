class TwofactorSettingsController {

  constructor($http) {
    this.$http = $http

    this.allStates = {
      UNDEFINED: 'UNDEFINED',
      TWOFACTOR_ALREADY_SETUP: 'TWOFACTOR_ALREADY_SETUP',
      UNINITIALIZED: 'UNINITIALIZED',
      SECRET_GENERATED: 'SECRET_GENERATED',
      SETUP_COMPLETE: 'SETUP_COMPLETE'
    }
    this.currentState = this.tfaStates.UNDEFINED


    this.qrCode = null
    this.$http.get('/auth/overwrite-totp-secret')
      .then(res => this.qrCode = res.data.qrCode)
      .catch(err => console.error(err))
  }

}

TwofactorSettingsController.$inject = ['$http']

let twofactorSettings = {
  templateUrl: '/components/global-settings/twofactor-settings.html',
  bindings: {
    managerView: '='
  },
  controller: TwofactorSettingsController
}

export default twofactorSettings
