// See README.md for details on how to use the accordion component
class AccordionController {
  constructor () {
    this.expandedAccordionIdListeners = []
    this.nextAvailableChildId = 0
  }

  $onInit () {
    this.expandedAccordionId = this.initialExpandedPanel
  }

  $doCheck () {
    // Toggle the panel in the following two ways
    // Programatically change the toggleExpandedPanel value.
    // When click the specific panel.
    if (this.toggleExpandedPanel && this.expandedAccordionId != this.toggleExpandedPanel) {
      this.setExpandedAccordionId(this.toggleExpandedPanel)
    }
  }

  // Returns the next available child ID.
  getNextChildId () {
    // Set the expanded accordion ID if this is the first child being added
    if (!this.expandedAccordionId) {
      this.setExpandedAccordionId(this.nextAvailableChildId)
    }
    return this.nextAvailableChildId++
  }

  // Sets the ID of the accordion to be expanded
  setExpandedAccordionId (id) {
    this.expandedAccordionId = id
    // Can set toggle panel when it is available.
    // We are using it in location/road segment select.
    if (this.toggleExpandedPanel) {
      this.toggleExpandedPanel = id
    }
    // Notify listeners (child elements) so that they can expand/collapse themselves
    this.expandedAccordionIdListeners.forEach((listener) => listener())
  }

  // Adds a listener that will be fired when the expanded accordion ID changes
  addExpandedAccordionIdListener (listener) {
    this.expandedAccordionIdListeners.push(listener)
  }
}

let accordion = {
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
  bindings: {
    initialExpandedPanel: '<',
    toggleExpandedPanel: '=' // [Optional] When we wants to toggle the panel programatically.
  },
  controller: AccordionController
}

export default accordion
