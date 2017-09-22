// See README.md for details on how to use the accordion component

class AccordionPanelController {
  constructor($element) {
    this.$element = $element
    this.panelId = null
  }

  $onInit() {
    // Set the unique (within siblings) id for this component
    this.panelId = this.parentAccordion.getNextChildId()
    // Register a listener that will handle the expanded accordion ID changing
    this.parentAccordion.addExpandedAccordionIdListener(this.onExpandedAccordionIdChanged.bind(this))
  }

  onExpandedAccordionIdChanged() {
    // Manually add and remove expanded/collapsed classes on the element. This has to be done because the
    // flexbox requires *immediate* children to have the "flex:" property.
    this.$element.removeClass('accordion-expanded')
    this.$element.removeClass('accordion-collapsed')
    var newClass = (this.parentAccordion.expandedAccordionId === this.panelId) ? 'accordion-expanded' : 'accordion-collapsed'
    this.$element.addClass(newClass)
  }
}

AccordionPanelController.inject = ['$element']

app.component('accordionPanel', {
  template: `
    <style scoped>
      .accordion-expanded {
        flex: 1 1 auto;
        transition: flex-grow 100ms, flex-shrink 100ms, visibility 0ms 100ms;
        overflow-y: auto;
      }
      .accordion-collapsed {
        flex: 0 0 auto;
        transition: flex-grow 100ms, flex-shrink 100ms, visibility 0ms 100ms;
      }
      .accordion-title {
        background-color: #333;
        color: white;
        font-weight: 700;
        font-size: 18px;
        border-radius: 0px;
      }
      .accordion-contents {
        overflow-y: hidden;
      }
      .accordion-contents.collapsed {
        height: 0px;
        visibility: hidden;
      }
    </style>
    <button class="btn btn-default btn-block accordion-title" ng-click="$ctrl.parentAccordion.setExpandedAccordionId($ctrl.panelId)">
      {{$ctrl.title}}
    </button>
    <div ng-class="{'accordion-contents': true, 'collapsed': $ctrl.parentAccordion.expandedAccordionId !== $ctrl.panelId}">
      <ng-transclude></ng-transclude>
    </div>
  `,
  transclude: true,
  require: {
    parentAccordion: '^accordion'
  },
  bindings: {
    title: '<'
  },
  controller: AccordionPanelController
})
