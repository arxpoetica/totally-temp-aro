class AccordionController {
  constructor() {
    this.expandedAccordionId = null
    this.expandedAccordionIdListeners = []
    this.nextAvailableChildId = 0
  }

  // Returns the next available child ID.
  getNextChildId() {
    // Set the expanded accordion ID if this is the first child being added
    if (!this.expandedAccordionId) {
      this.setExpandedAccordionId(this.nextAvailableChildId)
    }
    return this.nextAvailableChildId++
  }

  // Sets the ID of the accordion to be expanded
  setExpandedAccordionId(id) {
    this.expandedAccordionId = id
    // Notify listeners (child elements) so that they can expand/collapse themselves
    this.expandedAccordionIdListeners.forEach((listener) => listener())
  }

  // Adds a listener that will be fired when the expanded accordion ID changes
  addExpandedAccordionIdListener(listener) {
    this.expandedAccordionIdListeners.push(listener)
  }
}

app.component('accordion', {
  template: `
    <style scoped>
      .accordion-container {
        position: absolute; /* This will require the parent to have position: relative or absolute */
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
      }
    </style>
    <div>
      <!-- Note that we are applying the display:flex on ng-transclude, and then the panels must be a direct child
           of this element in order for the flexbox to work -->
      <ng-transclude class="accordion-container"></ng-transclude>
    </div>
  `,
  transclude: true,
  controller: AccordionController
})

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
        overflow-y: scroll;
      }
      .accordion-contents.collapsed {
        height: 0px;
        visibility: hidden;
      }
    </style>
    <button class="btn btn-default btn-block accordion-title" ng-click="$ctrl.parentAccordion.setExpandedAccordionId($ctrl.panelId)">
      This is the title
    </button>
    <div ng-class="{'accordion-contents': true, 'collapsed': $ctrl.parentAccordion.expandedAccordionId !== $ctrl.panelId}">
      <ng-transclude></ng-transclude>
    </div>
  `,
  transclude: true,
  require: {
    parentAccordion: '^accordion'
  },
  controller: AccordionPanelController
})