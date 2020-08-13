// See README.md for details on how to use the accordion component

class AccordionPanelContentsController {
  constructor ($element) {
    this.$element = $element
  }

  $onInit () {
    // Register a listener that will handle the expanded accordion ID changing
    this.parentAccordion.addExpandedAccordionIdListener(this.onExpandedAccordionIdChanged.bind(this))
    this.onExpandedAccordionIdChanged()
    this.$element.addClass('accordion-common')
  }

  onExpandedAccordionIdChanged () {
    // Manually add and remove expanded/collapsed classes on the element. This has to be done because the
    // flexbox requires *immediate* children to have the "flex:" property.
    this.$element.removeClass('accordion-expanded')
    this.$element.removeClass('accordion-collapsed')
    var newClass = (this.parentAccordion.expandedAccordionId === this.panelId) ? 'accordion-expanded' : 'accordion-collapsed'
    this.$element.addClass(newClass)
  }
}

AccordionPanelContentsController.$inject = ['$element']

let accordionPanelContents = {
  template: `
    <style scoped>
      .accordion-common {
        position: relative; /* this is used with position: absolute on the ng-transclude, otherwise the panel "jumps" to full height on expand */
      }
      .accordion-expanded {
        flex: 1 1 auto;
        transition: flex-grow 100ms, flex-shrink 100ms, visibility 0ms 100ms;
        overflow-x: hidden;
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
    <!-- The position:absolute style is used so that the content has a max height of the root component element.
         Without this, if we have a lot of content, the height of the accordion panel would "jump" while expanding -->
    <ng-transclude ng-if="!$ctrl.destroyOnHide || $ctrl.parentAccordion.expandedAccordionId === $ctrl.panelId" ng-class="{'hide-transcluded': $ctrl.parentAccordion.expandedAccordionId !== $ctrl.panelId }"
                   style="position: absolute; height: 100%; width: 100%;"></ng-transclude>
  `,
  transclude: true,
  require: {
    parentAccordion: '^accordion'
  },
  bindings: {
    panelId: '<',
    destroyOnHide: '<'
  },
  controller: AccordionPanelContentsController
}

export default accordionPanelContents
