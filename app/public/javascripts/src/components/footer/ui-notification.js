class WorkingNotificationController {
  constructor($scope, uiNotificationService){
    this.$scope = $scope
    this.uiNotificationService = uiNotificationService
    this.noteQueue = {}
  }
  
  $onInit() {
    this.uiNotificationService.initChannel(this.channel)
    this.noteQueue = this.uiNotificationService.channelsData[this.channel]
    this.uiNotificationService.channels[this.channel].subscribe((noteQueue) => {
      //console.log('update')
      //console.log(noteQueue)
      this.noteQueue = noteQueue
      this.$scope.$apply()
    })
  }
}

WorkingNotificationController.$inject = ['$scope', 'uiNotificationService']

let workingNotification = {
  templateUrl: '/components/footer/ui-notification.html',
  bindings: {
    channel: '<'
  },
  controller: WorkingNotificationController
}

export default workingNotification