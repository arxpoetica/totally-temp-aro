class BoundaryProperties {
  constructor(selectedSiteBoundaryTypeId, selectedSiteMoveUpdate, selectedSiteBoundaryGeneration, distance) {
    this.selectedSiteBoundaryTypeId = selectedSiteBoundaryTypeId  // List of all types is in state.js
    this.siteMoveUpdates = [
      'Auto-redraw',
      'Don\'t update'
    ]
    this.selectedSiteMoveUpdate = selectedSiteMoveUpdate
    this.siteBoundaryGenerations = [
      'Road Distance'
    ]
    this.selectedSiteBoundaryGeneration = selectedSiteBoundaryGeneration
    this.isDirty = false
  }
}

export default BoundaryProperties
