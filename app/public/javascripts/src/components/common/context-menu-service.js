app.service('contextMenuService', ['$rootScope', '$timeout', ($rootScope, $timeout) => {
  
  //Important: RxJS must have been included using browserify before this point
  var Rx = require('rxjs')
  
  var service = {}
  
  service.isMenuVisible = new Rx.Subject()
  service.menuItems = new Rx.Subject()
  service.menuXY = new Rx.Subject()
  
  service.populateMenu = (menuItems) => {
    console.log(menuItems)
    service.menuItems.next(menuItems)
  }
  
  service.moveMenu = (x, y) => {
    service.menuXY.next({'x':x, 'y':y})
  }
  
  service.menuOn = () => {
    service.isMenuVisible.next(true)
  }
  
  service.menuOff = () => {
    service.isMenuVisible.next(false)
  }
  
  // --- 
  
  service.makeItemOption = (label, callback, data, iconClass) => {
    return {
      'label': label, 
      'callback': callback, 
      'data': data, 
      'iconClass': iconClass
    }
  }
  
  //makeMenuItem(objectId, options, dataTypeList, name, feature, latLng){
  service.makeMenuItem = (label, data, options) => {
    /*
    var menuItem = {
      'label': name, 
      'data': {
        'objectId': objectId, 
        'options': options, 
        'dataTypeList': dataTypeList, 
        'name': name, 
        'feature': feature, 
        'latLng': latLng
      }
    }
    */
    var menuItem = {
      'label': label, 
      'data': data, 
      'options': options
    }
    
    return menuItem
  }
  
  return service
}])