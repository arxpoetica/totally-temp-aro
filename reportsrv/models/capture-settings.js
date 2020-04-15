const MercatorProjection = require('./mercator-projection')

class CaptureSettings {
  static fromPageSetup (reportPage) {

    // First, we are going to use a mercator sphere radius corresponding to the scale factor, and use
    // that to find the min and max latitude/longitude of the area we will be printing out.
    // From EPSG:900913 (used by Google Maps), Radius of earth at the equator = 6378137
    const radiusForScale = 6378137 / reportPage.pageSetup.mapScale.worldLengthPerMeterOfPaper
    const projectionScale = new MercatorProjection(radiusForScale)
    // Use the Mercator projection on our sphere to get the X, Y coordinates of the map center
    const xCenter = projectionScale.longitudeToX(reportPage.mapCenter.longitude)
    const yCenter = projectionScale.latitudeToY(reportPage.mapCenter.latitude)
    // Get the physical distance that we will cover along the latitude and longitude.
    // We have chosen the radius of the sphere (R) such that we have to move by an
    // amount equal to the paper size in meters.
    const sizeX = (reportPage.pageSetup.orientation === 'portrait') ? reportPage.pageSetup.paperSize.sizeX : reportPage.pageSetup.paperSize.sizeY
    const sizeY = (reportPage.pageSetup.orientation === 'portrait') ? reportPage.pageSetup.paperSize.sizeY : reportPage.pageSetup.paperSize.sizeX
    // Find the corner coordinates of the page in the Mercator (X, Y) coordinate system.
    // Note that the distance between yCenter and yMin will not be the same except at the equator
    // and the difference will get more pronounced at higher latitudes.
    const minLatitude = projectionScale.yToLatitude(yCenter - sizeY / 2)
    const minLongitude = projectionScale.xToLongitude(xCenter - sizeX / 2)
    const maxLatitude = projectionScale.yToLatitude(yCenter + sizeY / 2)
    const maxLongitude = projectionScale.xToLongitude(xCenter + sizeX / 2)

    // Calculate the zoom level at which we will take this screenshot
    const latitudeRadians = reportPage.mapCenter.latitude * Math.PI / 180.0
    const zoom = this._getZoom(reportPage.pageSetup.dpi, latitudeRadians, +reportPage.pageSetup.mapScale.worldLengthPerMeterOfPaper)

    // Calculate the radius of the sphere used for at this zoom level. The number of pixels on the X axis will
    // correspond to the length of the equator. The tile at zoom level 0 has a pixel size of 256x256.
    const radiusForScreenshot = 256 * Math.pow(2, zoom) / (2.0 * Math.PI)
    const projectionScreenshot = new MercatorProjection(radiusForScreenshot)
    
    // Now convert the min/max latitudes and longitudes to pixels, and use that delta as the window size in pixels.
    const minPrintX = projectionScreenshot.longitudeToX(minLongitude)
    const minPrintY = projectionScreenshot.latitudeToY(minLatitude)
    const maxPrintX = projectionScreenshot.longitudeToX(maxLongitude)
    const maxPrintY = projectionScreenshot.latitudeToY(maxLatitude)

    // First, calculate the pixels required based on the page size and dpi.
    const pageSizePixels = {
      x: Math.round(maxPrintX - minPrintX),
      y: Math.round(maxPrintY - minPrintY)
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
