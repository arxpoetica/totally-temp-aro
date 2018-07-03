app.service('uiNotificationService', ['$rootScope', ($rootScope) => {
  
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
    //console.log(channel+', '+noteText)
    if (!service.channelsData[channel].queue.hasOwnProperty(noteText)){
      service.channelsData[channel].queue[noteText] = 0
    }
    service.channelsData[channel].queue[noteText]++
    service.channelsData[channel].queueLen++
    service.channels[channel].next(service.channelsData[channel])
  }
  
  service.removeNotification = (channel, noteText) => {
    service.initChannel(channel)
    //console.log('Done: '+channel+', '+noteText)
    if (!service.channelsData[channel].queue.hasOwnProperty(noteText)) return
    
    service.channelsData[channel].queue[noteText]--
    if (service.channelsData[channel].queue[noteText] >= 0) delete service.channelsData[channel].queue[noteText]
    service.channelsData[channel].queueLen--
    if (service.channelsData[channel].queueLen > 0) service.channelsData[channel].queueLen = 0  
    
    service.channels[channel].next(service.channelsData[channel])
  }
  
  return service
}])