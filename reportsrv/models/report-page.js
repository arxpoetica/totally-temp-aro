class ReportPage {
  constructor(paperDimensions, worldLengthPerMeterOfPaper, dpi, orientation, mapCenter, planId, visibleLayers) {
    this.paperDimensions = paperDimensions
    this.worldLengthPerMeterOfPaper = worldLengthPerMeterOfPaper
    this.dpi = dpi
    this.orientation = orientation
    this.mapCenter = mapCenter
    this.planId = planId
    this.visibleLayers = visibleLayers
  }

  static getPaperDimensions (paperType) {
    // Note that all physical size definitions are in meters
    const a0Sizes = { x: 0.841, y: 1.189 }
    var paperSizeDefinitions = {}
    // Build sizes from A0 through A6
    var lastX = a0Sizes.y, lastY = a0Sizes.x * 2
    for (var i = 0; i <= 6; ++i) {
      const sizeX = lastY / 2
      const sizeY = lastX
      paperSizeDefinitions[`A${i}`] = { sizeX, sizeY }
      lastX = sizeX
      lastY = sizeY
    }
    return {
      x: paperSizeDefinitions[paperType].sizeX,
      y: paperSizeDefinitions[paperType].sizeY
    }
  }

  // Helper function to generate client parameters that we will send to the ARO app.
  toClientParams () {
    return {
      mapCenter: this.mapCenter,
      planId: this.planId,
      visibleLayers: this.visibleLayers
    }
  }
}

module.exports = ReportPage
