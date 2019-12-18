class CaptureSettings {
  static fromPageSetup (pageSetup) {
    // For a given page setup, this function will calculate thethe zoom level, width and height of 
    // the map that we need to take a screenshot of.

    // First, calculate the pixels required based on the page size and dpi.
    const INCHES_PER_METER = 39.3701
    const pixelsPerPaperMeter = pageSetup.dpi * INCHES_PER_METER
    const pageSizePixels = {
      x: Math.round(pageSetup.paperSize.sizeX * pixelsPerPaperMeter),
      y: Math.round(pageSetup.paperSize.sizeY * pixelsPerPaperMeter)
    }

    // From https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Resolution_and_Scale:
    // resolution = 156543.03 meters/pixel * cos(latitude) / (2 ^ zoomlevel)
    // scale = 1 : (screen_dpi * 1/0.0254 in/m * resolution)
    // Which gives us
    const zoom = Math.round(Math.log((pageSetup.dpi * (1.0 / 0.0254) * 156543.03 * Math.cos(pageSetup.latitude)) / pageSetup.mapScale.worldLengthPerMeterOfPaper ) / Math.log(2))
    return {
      pageSizePixels,
      zoom
    }
  }
}

module.exports = CaptureSettings
