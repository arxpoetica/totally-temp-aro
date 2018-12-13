class MultifactorSettingsController {

  constructor($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout

    this.tfaStates = {
      UNDEFINED: 'UNDEFINED',
      MULTIFACTOR_ALREADY_SETUP: 'MULTIFACTOR_ALREADY_SETUP',
      UNINITIALIZED: 'UNINITIALIZED',
      SECRET_GENERATED: 'SECRET_GENERATED',
      SETUP_COMPLETE: 'SETUP_COMPLETE'
    }
    this.currentState = this.tfaStates.UNDEFINED
    this.showSecretText = false
    this.verificationCode = null
    this.isWaitingForResponse = true
    this.$http.get('/multifactor/get-totp-status')
      .then(res => {
        this.isWaitingForResponse = false
        const status = res.data[0]
        if (!status.is_totp_enabled) {
          this.currentState = this.tfaStates.UNINITIALIZED
        } else {
          // TOTP is enabled. If it is not verified, then something went wrong with the verification. Set it to uninitialized.
          this.currentState = status.is_totp_verified ? this.tfaStates.MULTIFACTOR_ALREADY_SETUP : this.tfaStates.UNINITIALIZED
        }
        this.$timeout()
      })
      .catch(err => console.error(err))

    this.totpSecret = null
  }

  // Overwrite the TOTP secret for the user, and get it back so the user can sync with their app.
  // Note that this will overwrite any existing TOTP secret that the user has.
  overwriteSecretForUser() {
    this.isWaitingForResponse = true
    this.$http.get('/multifactor/overwrite-totp-secret')
      .then(res => {
        this.isWaitingForResponse = false
        this.totpSecret = res.data
        this.currentState = this.tfaStates.SECRET_GENERATED
        this.$timeout()
        const SECRET_EXPIRY = 120000 // milliseconds. Verify secret within this time.
        this.$timeout(() => this.totpSecret = null, SECRET_EXPIRY)   // Do not hold the secret for long
      })
      .catch(err => {
        this.currentState = this.tfaStates.UNDEFINED
        console.error(err)
      })
  }

  // Verify the TOTP secret for the user
  verifySecretForUser() {
    this.isWaitingForResponse = true
    this.$http.post('/multifactor/verify-totp-secret', { verificationCode: this.verificationCode })
      .then(res => {
        this.isWaitingForResponse = false
        this.currentState = this.tfaStates.SETUP_COMPLETE
        this.totpSecret = null
        this.verificationCode = null
        this.$timeout()
      })
      .catch(err => {
        this.currentState = this.tfaStates.UNDEFINED
        console.error(err)
      })
  }

  // Reset multi-factor authentication for the user
  resetMultiFactorForUser() {
    this.verifySecretForUser()
      .then(() => this.overwriteSecretForUser())
      .catch(err => console.error(err))
  }

  // Disable multi-factor authentication for the user
  disableMultiFactorForUser() {
    this.isWaitingForResponse = true
    this.$http.post(`/multifactor/delete-totp-settings`, { verificationCode: this.verificationCode })
      .then(res => {
        this.isWaitingForResponse = false
        this.currentState = this.tfaStates.UNINITIALIZED
        this.totpSecret = null
        this.verificationCode = null
        this.$timeout()
      })
      .catch(err => {
        this.currentState = this.tfaStates.UNDEFINED
        console.error(err)
      })
  }
}

MultifactorSettingsController.$inject = ['$http', '$timeout']

let multifactorSettings = {
  templateUrl: '/components/global-settings/multifactor-settings.html',
  bindings: {
    managerView: '='
  },
  controller: MultifactorSettingsController
}

export default multifactorSettings
