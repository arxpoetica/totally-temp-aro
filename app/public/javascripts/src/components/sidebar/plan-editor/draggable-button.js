import Constants from '../../common/constants'

class DraggableButtonController {

  constructor($element) {
    this.$element = $element
  }

  $onInit() {
    var buttonElement = this.$element.find('button')[0]
    // Set custom dragging data when this button is dragged
    buttonElement.ondragstart = (dragEvent) => {
      if (this.isDisabled) {
        return false
      }
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_KEY, this.entityType)
      dragEvent.dataTransfer.setData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY, this.entityDetails)
      return true
    }
  }

  $onDestroy() {
    // Remove any DOM listeners
    var buttonElement = this.$element.find('button')[0]
    buttonElement.ondragstart = null    
  }
}

DraggableButtonController.$inject = ['$element']
  
let draggableButton = {
  template: `
    <button class="btn btn-default draggable-item-button"
            ng-disabled="$ctrl.isDisabled">
      <img ng-src="{{$ctrl.icon}}">
    </button>
  `,
  bindings: {
    icon: '@',
    isDisabled: '<',
    entityType: '@',
    entityDetails: '@'
  },
  controller: DraggableButtonController
}

export default draggableButton
