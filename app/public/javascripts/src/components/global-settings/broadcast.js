class BroadcastController {
  constructor ($http, $timeout, state, globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.$http = $http
    this.$timeout = $timeout

    this.mailSubject = null
    this.mailBody = null
  }

  getConfirmation() {
    swal({
      title: 'Are you sure?',
      text: 'This message will be broadcast to all users. Are you sure you wish to proceed?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, Broadcast!',
      showCancelButton: true,
      closeOnConfirm: true
    }, (confirmed) => {
      confirmed && this.send()
    })
  }

  send() {
    this.$http.post('/socket/broadcast', {
      subject: this.mailSubject,
      body: this.mailBody
    })
    .catch((err) => console.error(err))
  }
}

BroadcastController.$inject = ['$http', '$timeout', 'state', 'globalSettingsService']

let broadcast = {
  templateUrl: '/components/global-settings/broadcast.html',
  controller: BroadcastController
}

export default broadcast
