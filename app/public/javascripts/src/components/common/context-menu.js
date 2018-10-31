
class ContextMenuController {
  
  constructor($element, $timeout, contextMenuService){
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
    this.menuItems = []
  }
  
  $onInit(){
    this.contextMenuService.isMenuVisible.subscribe((isMenuVisible) => {
      if (isMenuVisible){
        this.openMenu()
      }else{
        this.closeMenu()
      }
    })
    
    this.contextMenuService.menuXY.subscribe((menuXY) => {
      if ('undefined' != typeof menuXY.x) this.contextMenuCss.left = `${menuXY.x}px`
      if ('undefined' != typeof menuXY.y) this.contextMenuCss.top = `${menuXY.y}px`
    })
    
    this.contextMenuService.menuItems.subscribe((menuItems) => {
      this.menuItems = menuItems
    })
  }
  
  // --- 
  
  openMenu(){
    this.contextMenuCss.display = 'block'
  }
  
  closeMenu(){
    this.contextMenuCss.display = 'none'
  }
  
  onOptionClick(callback, data){
    this.closeMenu()
    callback(data)
  }
  
}


ContextMenuController.$inject = ['$element', '$timeout', 'contextMenuService']

let contextMenu = {
  templateUrl: '/components/common/context-menu.html',
  bindings: {},
  controller: ContextMenuController
}

export default contextMenu