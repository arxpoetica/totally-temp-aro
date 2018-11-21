import Constants from '../../common/constants'

class DraggableButtonController {

  constructor($element, state) {
    this.$element = $element
    this.state = state
  }

  $onInit() {
    var buttonElement = this.$element.find('button')[0]
    this.imageElement = this.$element.find('img')[0]
    
    // Set custom dragging data when this button is dragged
    buttonElement.ondragstart = (dragEvent) => {
      this.state.dragStartEvent.next(dragEvent)
      if (this.isDisabled) {
        return false
      }
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_KEY, this.entityType)
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY, this.entityDetails)
      
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_X, dragEvent.offsetX)
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_OFFSET_Y, dragEvent.offsetY)
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_W, this.imageElement.width)
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_GRAB_ICON_H, this.imageElement.height)
      
      if (this.isBoundary) {
        dragEvent.dataTransfer.setData(Constants.DRAG_IS_BOUNDARY, 'true')
      }
      return true
    }
    // Fire an event on dragend
    buttonElement.ondragend = (dragEvent) => {
      this.state.dragEndEvent.next(dragEvent)
    }
  }

  $onDestroy() {
    // Remove any DOM listeners
    var buttonElement = this.$element.find('button')[0]
    buttonElement.ondragstart = null    
  }
}

DraggableButtonController.$inject = ['$element', 'state']
  
let draggableButton = {
  template: `
    <button class="btn btn-light draggable-item-button"
            ng-disabled="$ctrl.isDisabled">
      <img ng-src="{{$ctrl.icon}}">
    </button>
  `,
  bindings: {
    icon: '@',
    isDisabled: '<',
    entityType: '@',
    entityDetails: '@',
    isBoundary: '@'
  },
  controller: DraggableButtonController
}

export default draggableButton
