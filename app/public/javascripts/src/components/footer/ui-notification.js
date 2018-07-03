class WorkingNotificationController {
  constructor($scope, uiNotificationService){
    this.$scope = $scope
    this.uiNotificationService = uiNotificationService
    this.noteQueue = {}
  }
  
  $onInit() {
    this.uiNotificationService.initChannel(this.channel)
    
    //this.uiNotificationService.addNotification('main', 'this is a test message 1')
    //this.uiNotificationService.addNotification('main', 'and this is another test message 22')
    
    this.noteQueue = this.uiNotificationService.channelsData[this.channel]
    this.uiNotificationService.channels[this.channel].subscribe((noteQueue) => {
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