class AccordionController {
  constructor() {
    this.expandedAccordionId = 'ONE'
    this.expandedAccordionIdListeners = []
  }

  setExpandedAccordionId(id) {
    this.expandedAccordionId = id
    this.expandedAccordionIdListeners.forEach((listener) => listener())
  }

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
    console.log($element)
  }

  $onInit() {
    console.log('init')
    console.log(this.parentAccordion)
    this.parentAccordion.addExpandedAccordionIdListener(this.onExpandedAccordionIdChanged.bind(this))
  }

  $onChange() {
    console.log('onchange triggered')
    console.log(this)
  }

  onExpandedAccordionIdChanged() {
    console.log(`${this.panelId}, ${this.parentAccordion.expandedAccordionId}`)
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
      }
      .accordion-collapsed {
        flex: 0 0 auto;
      }
      .accordion-title {
        flex: 0 0 auto;
        background-color: #333;
        color: white;
        font-weight: 700;
        font-size: 18px;
        border-radius: 0px;
      }
      .accordion-contents {
        flex: 1 1 auto;
        transition: flex-grow 100ms, flex-shrink 100ms, visibility 0ms 100ms;
        overflow: hidden;
        max-height: 500px;
        overflow: auto;
      }
      .accordion-contents.collapsed {
        flex: 0 0 auto;
        height: 0px;
        visibility: hidden;
      }
    </style>
    <div class="accordion-title" ng-click="$ctrl.parentAccordion.setExpandedAccordionId($ctrl.panelId)">
      This is the title
    </div>
    <div ng-class="{'accordion-contents': true, 'collapsed': $ctrl.parentAccordion.expandedAccordionId !== $ctrl.panelId}">
      <ng-transclude></ng-transclude>
    </div>
  `,
  transclude: true,
  require: {
    parentAccordion: '^accordion'
  },
  bindings: {
    panelId: '<'
  },
  controller: AccordionPanelController
})