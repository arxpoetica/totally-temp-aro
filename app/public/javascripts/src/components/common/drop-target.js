class DropTargetController {
  constructor ($element) {
    $element[0].ondrop = (event) => {
      event.preventDefault()
      this.onDropped && this.onDropped({
        dropEvent: event,
        targetObjectId: this.targetObjectId
      })
    }
  }
}

DropTargetController.$inject = ['$element']

let dropTarget = {
  template: `
  `,
  bindings: {
    ngStyle: '<',
    targetObjectId: '<',
    onDropped: '&'
  },
  controller: DropTargetController
}

export default dropTarget
