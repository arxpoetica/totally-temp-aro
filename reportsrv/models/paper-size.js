class PaperSize {
  constructor (type, sizeX, sizeY) {
    this.type = type
    this.sizeX = sizeX
    this.sizeY = sizeY
  }

  static getPaperSize (type) {
    // Note that all physical size definitions are in meters
    const a0Sizes = { x: 0.841, y: 1.189 }
    var paperSizeDefinitions = {}
    // Build sizes from A0 through A6
    for (var i = 0; i <= 6; ++i) {
      const multiplier = 1.0 / Math.pow(2, i)
      paperSizeDefinitions[`A${i}`] = { sizeX: a0Sizes.x * multiplier, sizeY: a0Sizes.y * multiplier}
    }
    return new PaperSize(type, paperSizeDefinitions[type].sizeX, paperSizeDefinitions[type].sizeY)
  }

}

module.exports = PaperSize