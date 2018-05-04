class BoundaryProperties {
  constructor(selectedSiteBoundaryTypeId, selectedSiteMoveUpdate, selectedSiteBoundaryGeneration, distance, spatialEdgeType) {
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
    this.spatialEdgeType = spatialEdgeType
    this.isDirty = false
  }
}

export default BoundaryProperties
