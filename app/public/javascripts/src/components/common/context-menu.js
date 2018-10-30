
class ContextMenuController {
  
  constructor($element, $timeout){
    this.$element = $element 
    this.$timeout = $timeout
    
    this.contextMenuElement = null
    this.contextMenuCss = {
      display: 'block',
      position: 'absolute',
      visible: true,
      top: '100px',
      left: '100px'
    }
    this.menuItems = []
  }
  
  $onInit(){
    // Remove the context menu from the map-object editor and put it as a child of the <BODY> tag. This ensures
    // that the context menu appears on top of all the other elements. Wrap it in a $timeout(), otherwise the element
    // changes while the component is initializing, and we get a AngularJS error.
    this.$timeout(() => {
      this.contextMenuElement = this.$element.find('.map-object-editor-context-menu-container')[0]
      this.$element[0].removeChild(this.contextMenuElement)
      var documentBody = this.$document.find('body')[0]
      documentBody.appendChild(this.contextMenuElement)

      this.dropTargetElement = this.$element.find('.map-object-drop-targets-container')[0]
      this.$element[0].removeChild(this.dropTargetElement)
      var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
      mapCanvas.appendChild(this.dropTargetElement)
    }, 0)
  }
  
  $onDestroy() {
    // Remove the context menu from the document body
    this.$timeout(() => {
      var documentBody = this.$document.find('body')[0]
      documentBody.removeChild(this.contextMenuElement)
      var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
      mapCanvas.removeChild(this.dropTargetElement)
    }, 0)
  }
  
  makeItemOption(label, callback, data, iconClass){
    return {
      'label': label, 
      'callback': callback, 
      'data': data, 
      'iconClass': iconClass
    }
  }
  
  //makeMenuItem(objectId, options, dataTypeList, name, feature, latLng){
  makeMenuItem(label, data, options){
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
  
  // --- 
  
  populateMenu(menuItems){
    this.menuItems = menuItems
  }
  
  openMenu(x, y){
    if ('undefined' != typeof x) this.contextMenuCss.left = `${x}px`
    if ('undefined' != typeof y) this.contextMenuCss.top = `${y}px`
    this.contextMenuCss.display = 'block'
    this.$timeout()
  }
  
  closeMenu(){
    this.contextMenuCss.display = 'none'
  }
}

ContextMenuController.$inject = ['$element', '$timeout',]

let contextMenu = {
  templateUrl: '/components/common/context-menu.html',
  bindings: {},
  controller: ContextMenuController
}

export default contextMenu