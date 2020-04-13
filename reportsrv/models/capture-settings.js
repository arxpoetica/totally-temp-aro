class CaptureSettings {
  static fromPageSetup (reportPage) {

    // First, calculate the zoom level at which we will take this screenshot
    const latitudeRadians = reportPage.mapCenter.latitude * Math.PI / 180.0
    const zoom = this._getZoom(reportPage.pageSetup.dpi, latitudeRadians, +reportPage.pageSetup.mapScale.worldLengthPerMeterOfPaper)

    // The zoom level uses Math.ceil(), so we have to take that in account when calculating the page size in pixels
    const sizeX = (reportPage.pageSetup.orientation === 'portrait') ? reportPage.pageSetup.paperSize.sizeX : reportPage.pageSetup.paperSize.sizeY
    const sizeY = (reportPage.pageSetup.orientation === 'portrait') ? reportPage.pageSetup.paperSize.sizeY : reportPage.pageSetup.paperSize.sizeX
    const physicalDistanceAlongLongitude = reportPage.pageSetup.mapScale.worldLengthPerMeterOfPaper * sizeX
    const physicalDistanceAlongLatitude = reportPage.pageSetup.mapScale.worldLengthPerMeterOfPaper * sizeY
    const physicalMetersPerPixel = this._getResolution(latitudeRadians, zoom)
    // For a given page setup, this function will calculate the zoom level, width and height of 
    // the map that we need to take a screenshot of.

    // First, calculate the pixels required based on the page size and dpi.
    const pageSizePixels = {
      x: Math.round(physicalDistanceAlongLongitude / physicalMetersPerPixel),
      y: Math.round(physicalDistanceAlongLatitude / physicalMetersPerPixel)
    }
    return {
      pageSizePixels,
      zoom
    }
  }

  static _getZoom (dpi, latitude, worldLengthPerMeterOfPaper) {
    // From https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Resolution_and_Scale
    // Exact length of the equator (according to wikipedia) is 40075.016686 km in WGS-84. At zoom 0, one pixel would equal 156543.03 meters (assuming a tile size of 256 px):
    // 40075.016686 * 1000 / 256 ≈ 6378137.0 * 2 * pi / 256 ≈ 156543.03
    // Which gives us a formula to calculate resolution at any given zoom:
    // resolution = 156543.03 meters/pixel * cos(latitude) / (2 ^ zoomlevel)
    // Some applications need to know a map scale, that is, how 1 cm on a screen translates to 1 cm of a map.
    // scale = 1 : (screen_dpi * 1/0.0254 in/m * resolution)

    // pageSetup.worldLengthPerMeterOfPaper = (screen_dpi * 1/0.0254 in/m * resolution)
    // pageSetup.worldLengthPerMeterOfPaper = (screen_dpi * 1/0.0254 in/m * 156543.03 meters/pixel * cos(latitude) / (2 ^ zoomlevel))
    // (2 ^ zoomlevel) = (screen_dpi * 1/0.0254 in/m * 156543.03 meters/pixel * cos(latitude)) / pageSetup.worldLengthPerMeterOfPaper
    // zoomlevel = Math.log2((screen_dpi * 1/0.0254 in/m * 156543.03 meters/pixel * cos(latitude)) / pageSetup.worldLengthPerMeterOfPaper)
    return Math.ceil(Math.log2((dpi * 1/0.0254 * 156543.03 * Math.cos(latitude) / worldLengthPerMeterOfPaper)))
  }

  static _getResolution (latitude, zoom) {
    // From https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Resolution_and_Scale
    // Exact length of the equator (according to wikipedia) is 40075.016686 km in WGS-84. At zoom 0, one pixel would equal 156543.03 meters (assuming a tile size of 256 px):
    // 40075.016686 * 1000 / 256 ≈ 6378137.0 * 2 * pi / 256 ≈ 156543.03
    // Which gives us a formula to calculate resolution at any given zoom:
    // resolution = 156543.03 meters/pixel * cos(latitude) / (2 ^ zoomlevel)
    // return 156543.03 * Math.cos(latitude) / Math.pow(2, zoom)
    // TODO: Why does cosine(latitude) not work? Is google maps taking care of this?
    return 156543.03 / Math.pow(2, zoom)
  }
}

module.exports = CaptureSettings
