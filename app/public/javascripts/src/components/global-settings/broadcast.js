class BroadcastController {
  constructor ($http, $timeout, state, globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.$http = $http
    this.$timeout = $timeout

    this.mailSubject = null
    this.mailBody = null
  }

  send() {
    console.log(this.mailSubject);
    console.log(this.mailBody)
  }
}

BroadcastController.$inject = ['$http', '$timeout', 'state', 'globalSettingsService']

let broadcast = {
  templateUrl: '/components/global-settings/broadcast.html',
  controller: BroadcastController
}

export default broadcast
