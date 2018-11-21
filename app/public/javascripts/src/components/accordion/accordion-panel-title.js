// See README.md for details on how to use the accordion component

class AccordionPanelTitleController {
  constructor($element) {
    this.$element = $element
  }

  $onInit() {
    // Have to do this because the "flex" property has to be applied on the root element
    this.$element.addClass('accordion-title-root')
  }
}

AccordionPanelTitleController.$inject = ['$element']

let accordionPanelTitle = {
  template: `
    <style scoped>
      .accordion-title, .accordion-title:focus, .accordion-title:hover {
        background-color: #333;
        color: white;
        font-size: 18px;
        border-radius: 0px;
      }
      .accordion-title-root {
        flex: 0 0 auto;
      }
    </style>
    <button class="btn btn-light btn-block accordion-title" ng-click="$ctrl.parentAccordion.setExpandedAccordionId($ctrl.panelId)">
      {{$ctrl.title}}
    </button>
  `,
  transclude: true,
  require: {
    parentAccordion: '^accordion'
  },
  bindings: {
    title: '<',
    panelId: '<'
  },
  controller: AccordionPanelTitleController
}

export default accordionPanelTitle