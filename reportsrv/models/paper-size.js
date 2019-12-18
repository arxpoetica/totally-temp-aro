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
    var lastX = a0Sizes.y, lastY = a0Sizes.x * 2
    for (var i = 0; i <= 6; ++i) {
      const sizeX = lastY / 2
      const sizeY = lastX
      paperSizeDefinitions[`A${i}`] = { sizeX, sizeY }
      lastX = sizeX
      lastY = sizeY
    }
    return new PaperSize(type, paperSizeDefinitions[type].sizeX, paperSizeDefinitions[type].sizeY)
  }

}

module.exports = PaperSize