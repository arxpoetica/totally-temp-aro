const MercatorProjection = require('./mercator-projection')

class CaptureSettings {

  constructor (left, top, width, height, reportPage, browserWindowSize, zoom) {
    // left, top, right and bottom are a fraction of the page size (0 to 1.0)
    this.left = left
    this.top = top
    this.width = width
    this.height = height
    this.reportPage = reportPage
    this.browserWindowSize = browserWindowSize
    this.zoom = zoom
  }

  static fromPageSetup (reportPage) {

    // First, we are going to use a mercator sphere radius corresponding to the scale factor, and use
    // that to find the min and max latitude/longitude of the area we will be printing out.
    // From EPSG:900913 (used by Google Maps), Radius of earth at the equator = 6378137
    const radiusForScale = 6378137 / reportPage.worldLengthPerMeterOfPaper
    const projectionScale = new MercatorProjection(radiusForScale)

    // Use the Mercator projection on our sphere to get the X, Y coordinates of the map center
    const xCenter = projectionScale.longitudeToX(reportPage.mapCenter.longitude)
    const yCenter = projectionScale.latitudeToY(reportPage.mapCenter.latitude)

    // Get the physical distance that we will cover along the latitude and longitude.
    // We have chosen the radius of the sphere (R) such that we have to move by an
    // amount equal to the paper size in meters.
    const sizeX = (reportPage.orientation === 'portrait') ? reportPage.paperDimensions.x : reportPage.paperDimensions.y
    const sizeY = (reportPage.orientation === 'portrait') ? reportPage.paperDimensions.y : reportPage.paperDimensions.x

    // Find the corner coordinates of the page in the Mercator (X, Y) coordinate system.
    // Note that the distance between yCenter and yMin will not be the same except at the equator
    // and the difference will get more pronounced at higher latitudes.
    const minLatitude = projectionScale.yToLatitude(yCenter - sizeY / 2)
    const minLongitude = projectionScale.xToLongitude(xCenter - sizeX / 2)
    const maxLatitude = projectionScale.yToLatitude(yCenter + sizeY / 2)
    const maxLongitude = projectionScale.xToLongitude(xCenter + sizeX / 2)

    // Calculate the zoom level at which we will take this screenshot
    const zoom = this._getZoom(reportPage.dpi, reportPage.mapCenter.latitude, +reportPage.worldLengthPerMeterOfPaper)

    // Calculate the radius of the sphere used for at this zoom level. The number of pixels on the X axis will
    // correspond to the length of the equator. The tile at zoom level 0 has a pixel size of 256x256.
    const radiusForScreenshot = 256 * Math.pow(2, zoom) / (2.0 * Math.PI)
    const projectionScreenshot = new MercatorProjection(radiusForScreenshot)
    
    // Now convert the min/max latitudes and longitudes to pixels, and use that delta as the window size in pixels.
    const minPrintX = projectionScreenshot.longitudeToX(minLongitude)
    const minPrintY = projectionScreenshot.latitudeToY(minLatitude)
    const maxPrintX = projectionScreenshot.longitudeToX(maxLongitude)
    const maxPrintY = projectionScreenshot.latitudeToY(maxLatitude)

    // Headless Chrome has some limitations on how big the window size can be. Divide the page into parts for taking screenshots.
    const MAX_BROWSER_WIDTH = 1200
    const MAX_BROWSER_HEIGHT = 1200
    const numColumns = Math.ceil((maxPrintX - minPrintX) / MAX_BROWSER_WIDTH)
    const numRows = Math.ceil((maxPrintY - minPrintY) / MAX_BROWSER_HEIGHT)
    var captureSettings = []
    const partWidth = Math.round((maxPrintX - minPrintX) / numColumns)
    const partHeight = Math.round((maxPrintY - minPrintY) / numRows)
    for (var iRow = 0; iRow < numRows; ++iRow) {
      for (var iColumn = 0; iColumn < numColumns; ++iColumn) {
        // Get the pixel coordinates for this part
        const minPartX = Math.round(minPrintX + iColumn * partWidth)
        const minPartY =  Math.round(minPrintY + iRow * partHeight)
        // Calculate the pixel coordinates of the center
        const mapCenterXPixels = minPartX + partWidth / 2
        const mapCenterYPixels = minPartY + partHeight / 2
        // Now, calculate the lat/longs corresponding to the center point
        const mapCenterPart = {
          latitude: projectionScreenshot.yToLatitude(mapCenterYPixels),
          longitude: projectionScreenshot.xToLongitude(mapCenterXPixels)
        }
        const partReportPage = JSON.parse(JSON.stringify(reportPage))
        partReportPage.paperDimensions.x = partReportPage.paperDimensions.x / numColumns
        partReportPage.paperDimensions.y = partReportPage.paperDimensions.y / numRows
        partReportPage.mapCenter = mapCenterPart
        const pageSizePixels = {
          x: partWidth,
          y: partHeight
        }
        const captureSetting = new CaptureSettings(iColumn / numColumns, (numRows - iRow - 1) / numRows, 1 / numColumns, 1 / numRows, partReportPage, pageSizePixels, zoom)
        captureSettings.push(captureSetting)
      }
    }
    return captureSettings
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
    const latitudeRadians = latitude * Math.PI / 180.0
    return Math.ceil(Math.log2((dpi * 1/0.0254 * 156543.03 * Math.cos(latitudeRadians) / worldLengthPerMeterOfPaper)))
  }
}

module.exports = CaptureSettings
