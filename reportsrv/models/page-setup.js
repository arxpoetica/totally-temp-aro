class PageSetup {
  constructor (paperSize, mapScale, dpi, orientation, latitude = 45.0 * Math.PI / 180.0) {
    this.paperSize = paperSize
    this.mapScale = mapScale
    this.dpi = dpi
    this.orientation = orientation
    this.latitude = latitude
  }
}

module.exports = PageSetup