class WorkingNotificationController {
  constructor(){
    this.noteCount = 0
  }
  /*
  addNotification(noteText){
    console.log(noteText + " " + this.noteCount)
    this.noteCount ++
  }
  
  removeNotification(noteText){
    console.log("DONE: "+noteText + " " + this.noteCount)
    this.noteCount ++
  }
  */
}

let workingNotification = {
  templateUrl: '/components/footer/working-notification.html',
  bindings: {},
  controller: WorkingNotificationController
}

export default workingNotification