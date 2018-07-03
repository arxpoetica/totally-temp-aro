app.service('uiNotificationService', ['$rootScope', '$timeout', ($rootScope, $timeout) => {
  
  //Important: RxJS must have been included using browserify before this point
  var Rx = require('rxjs')
  
  var service = {}
  
  service.channels = {}
  service.channelsData = {}
  
  service.initChannel = (channel) => {
    if (!service.channels.hasOwnProperty(channel)){
      service.channelsData[channel] = {'queue':{}, 'queueLen':0}
      service.channels[channel] = new Rx.Subject()
    }
  }
  
  service.addNotification = (channel, noteText) => {
    service.initChannel(channel)
    
    if (!service.channelsData[channel].queue.hasOwnProperty(noteText)){
      service.channelsData[channel].queue[noteText] = 0
    }
    service.channelsData[channel].queue[noteText]++
    service.channelsData[channel].queueLen++
    service.channels[channel].next(service.channelsData[channel])
    //console.log(service.channelsData[channel].queue[noteText] +' '+ channel+', '+noteText)
  }
  
  service.removeNotification = (channel, noteText) => {
    service.initChannel(channel)
    
    if (!service.channelsData[channel].queue.hasOwnProperty(noteText)) return
    
    // we want a minimum time for the message to be on screen, 
    //    there may be a serries that are popping on and off right after eachother for a while 
    //    but would never show up with out this delay
    
    setTimeout(() => {  
      service.channelsData[channel].queue[noteText]--
      if (service.channelsData[channel].queue[noteText] <= 0) delete service.channelsData[channel].queue[noteText]
      service.channelsData[channel].queueLen--
      if (service.channelsData[channel].queueLen < 0) service.channelsData[channel].queueLen = 0  
      
      //console.log('Done: '+service.channelsData[channel].queue[noteText]+' '+channel+', '+noteText)
      
      service.channels[channel].next(service.channelsData[channel])
    }, 100)
  }
  
  return service
}])