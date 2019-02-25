class BoundaryProperties {
  constructor (selectedSiteBoundaryTypeId, selectedSiteMoveUpdate, selectedSiteBoundaryGeneration, spatialEdgeType, directed, networkNodeType, deploymentType) {
    this.selectedSiteBoundaryTypeId = selectedSiteBoundaryTypeId // List of all types is in state.js
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
    this.directed = directed
    this.networkNodeType = networkNodeType
    this.isDirty = false
    this.deploymentType = 'PLANNED'
    if (typeof deploymentType !== 'undefined') this.deploymentType = deploymentType
  }
}

export default BoundaryProperties
