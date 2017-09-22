// See README.md for details on how to use the accordion component

class AccordionPanelContentsController {
  constructor($element) {
    this.$element = $element
  }

  $onInit() {
    // Register a listener that will handle the expanded accordion ID changing
    this.parentAccordion.addExpandedAccordionIdListener(this.onExpandedAccordionIdChanged.bind(this))
    this.onExpandedAccordionIdChanged()
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

AccordionPanelContentsController.inject = ['$element']

app.component('accordionPanelContents', {
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
      .hide-transcluded {
        display: none;
      }
    </style>
    <ng-transclude ng-class="{'hide-transcluded': $ctrl.parentAccordion.expandedAccordionId !== $ctrl.panelId }"></ng-transclude>
  `,
  transclude: true,
  require: {
    parentAccordion: '^accordion'
  },
  bindings: {
    panelId: '<'
  },
  controller: AccordionPanelContentsController
})
