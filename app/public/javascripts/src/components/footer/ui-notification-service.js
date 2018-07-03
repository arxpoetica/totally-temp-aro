app.service('uiNotificationService', ['$rootScope', ($rootScope) => {
  
  var uiNotificationService = {}
  
  
  
  var noteCount = 0
  
  
  uiNotificationService.addNotification = (channel, noteText) => {
    console.log(noteText + " " + noteCount)
    noteCount ++
  }
  
  uiNotificationService.removeNotification = (channel, noteText) => {
    console.log("DONE: "+noteText + " " + noteCount)
    noteCount ++
  }
  
  return uiNotificationService
}])