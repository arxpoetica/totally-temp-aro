
class ContextMenuController {
  
  constructor($scope, $element, $timeout, contextMenuService){
    this.$scope = $scope
    this.$element = $element 
    this.$timeout = $timeout
    this.contextMenuService = contextMenuService
    
    this.contextMenuElement = null
    this.contextMenuCss = {
      display: 'none',
      position: 'absolute',
      visible: true,
      top: '100px',
      left: '100px'
    }
    this.positionCss = {
      bottom: 'auto'
    }
    this.menuItems = []
    this.isVisible = false
  }
  
  $onInit(){
    /*
    this.$timeout(() => {
      console.log('on time out')
    }, 0)
    */
    this.contextMenuService.isMenuVisible.subscribe((isMenuVisible) => {
      if (isMenuVisible){
        this.openMenu()
      }else{
        this.closeMenu()
      }
    })
    
    this.contextMenuService.menuXY.subscribe((menuXY) => {
      if ('undefined' == typeof menuXY) return
      if ('undefined' != typeof menuXY.x) this.contextMenuCss.left = `${menuXY.x}px`
      if ('undefined' != typeof menuXY.y) this.contextMenuCss.top = `${menuXY.y}px`
      this.refreshView()
    })
    
    this.contextMenuService.menuItems.subscribe((menuItems) => {
      this.menuItems = menuItems
      this.refreshView()
    })
  }
  
  // --- 
  
  openMenu(){
    this.isVisible = true
    this.contextMenuCss.display = 'block'
    this.refreshView()
  }
  
  closeMenu(){
    this.isVisible = false
    this.contextMenuCss.display = 'none'
  }
  
  onOptionClick(callback, data){
    this.closeMenu()
    callback(data)
  }
  
  refreshView(){
    if (!this.isVisible) return
    
    try{
      if(!this.$scope.$$phase) this.$scope.$digest()
    }catch(error){
      // we can silent fail this 
    }
    
    var parentH = this.$element.find('.context-menu-dropdown')[0].offsetHeight
    var contentH = this.$element.find('.map-object-editor-context-menu-dropdown')[0].offsetHeight
    if (contentH >= parentH) {
      this.positionCss.bottom = '0'
    }else{
      this.positionCss.bottom = 'auto'
    }
  }
  
}


ContextMenuController.$inject = ['$scope', '$element', '$timeout', 'contextMenuService']

let contextMenu = {
  templateUrl: '/components/common/context-menu.html',
  bindings: {},
  controller: ContextMenuController
}

export default contextMenu