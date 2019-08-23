
class ContextMenuController {
  constructor ($scope, $element, $timeout, contextMenuService) {
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
    this.startMenuIndex = 0
    this.MAX_MENU_ITEMS = 6 // The maximum number of menu items to show
  }

  $onInit () {
    this.contextMenuService.isMenuVisible.subscribe((isMenuVisible) => {
      if (isMenuVisible) {
        this.openMenu()
      } else {
        this.closeMenu()
      }
    })

    this.contextMenuService.menuXY.subscribe((menuXY) => {
      if (typeof menuXY === 'undefined') return
      if (typeof menuXY.x !== 'undefined') this.contextMenuCss.left = `${menuXY.x}px`
      if (typeof menuXY.y !== 'undefined') this.contextMenuCss.top = `${menuXY.y}px`
      this.refreshView()
    })

    this.contextMenuService.menuItems.subscribe((menuItems) => {
      this.menuItems = menuItems
      this.refreshView()
    })
  }

  // ---

  openMenu () {
    this.startMenuIndex = 0
    this.isVisible = true
    this.contextMenuCss.display = 'block'
    this.refreshView()
  }

  closeMenu () {
    this.isVisible = false
    this.contextMenuCss.display = 'none'
  }

  onOptionClick (callback, data) {
    this.contextMenuService.menuOff()
    callback(data)
  }

  scrollMenuDown () {
    if ((this.startMenuIndex + this.MAX_MENU_ITEMS) < this.menuItems.length) {
      this.startMenuIndex = this.startMenuIndex + 1
    }
  }

  scrollMenuUp () {
    if (this.startMenuIndex > 0) {
      this.startMenuIndex = this.startMenuIndex - 1
    }
  }

  refreshView () {
    if (!this.isVisible) return

    try {
      if (!this.$scope.$$phase) this.$scope.$digest()
    } catch (error) {
      // we can silent fail this
    }

    var parentH = this.$element.find('.angular-context-menu-dropdown')[0].offsetHeight
    var contentH = this.$element.find('.map-object-editor-context-menu-dropdown')[0].offsetHeight
    // console.log({'contentH': contentH, 'parentH': parentH})
    if (contentH < parentH) {
      this.positionCss.bottom = 'auto'
    } else {
      this.positionCss.bottom = '0'
    }
  }
}

ContextMenuController.$inject = ['$scope', '$element', '$timeout', 'contextMenuService']

let contextMenu = {
  templateUrl: '/components/common/context-menu/context-menu.html',
  bindings: {},
  controller: ContextMenuController
}

export default contextMenu
