class CaptureSettings {
  static fromPageSetup (pageSetup) {
    // For a given page setup, this function will calculate thethe zoom level, width and height of 
    // the map that we need to take a screenshot of.

    // First, calculate the pixels required based on the page size and dpi.
    const INCHES_PER_METER = 39.3701
    const pixelsPerPaperMeter = pageSetup.dpi * INCHES_PER_METER
    const sizeX = (pageSetup.orientation === 'portrait') ? pageSetup.paperSize.sizeX : pageSetup.paperSize.sizeY
    const sizeY = (pageSetup.orientation === 'portrait') ? pageSetup.paperSize.sizeY : pageSetup.paperSize.sizeX
    const pageSizePixels = {
      x: Math.round(sizeX * pixelsPerPaperMeter),
      y: Math.round(sizeY * pixelsPerPaperMeter)
    }

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
    const zoom = Math.floor(Math.log2((pageSetup.dpi * 1/0.0254 * 156543.03 * Math.cos(pageSetup.latitude *  Math.PI / 180.0)) / +pageSetup.mapScale.worldLengthPerMeterOfPaper))
    return {
      pageSizePixels,
      zoom
    }
  }
}

module.exports = CaptureSettings
