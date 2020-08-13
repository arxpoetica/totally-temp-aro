class WorkingNotificationController {
  constructor ($scope, $timeout, uiNotificationService) {
    this.$scope = $scope
    this.$timeout = $timeout
    this.uiNotificationService = uiNotificationService
    this.noteQueue = {}
  }

  $onInit () {
    this.uiNotificationService.initChannel(this.channel)
    this.noteQueue = this.uiNotificationService.channelsData[this.channel]
    this.uiNotificationService.channels[this.channel].subscribe((noteQueue) => {
      this.noteQueue = noteQueue
      this.$timeout()
    })
  }
}

WorkingNotificationController.$inject = ['$scope', '$timeout', 'uiNotificationService']

let workingNotification = {
  templateUrl: '/components/footer/ui-notification.html',
  bindings: {
    channel: '<'
  },
  controller: WorkingNotificationController
}

export default workingNotification
