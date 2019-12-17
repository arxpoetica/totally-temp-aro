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

    // const EQUATOR_LENGTH = 40075.016686 * 1000.0  // Meters, per WGS-84 and https://en.wikipedia.org/wiki/Equator#Exact_length_of_the_Equator
    // const CIRCUMFERENCE_AT_LATITUDE = EQUATOR_LENGTH * Math.cos(this.pageSetup.latitude)
    // At zoom level 0, we would print CIRCUMFERENCE_AT_LATITUDE spanning across pageSizePixels.x. Map scale paperSize.x:CIRCUMFERENCE_AT_LATITUDE
    // At zoom level 1, we would print CIRCUMFERENCE_AT_LATITUDE / 2 spanning across pageSizePixels.x. Map scale paperSize.x:CIRCUMFERENCE_AT_LATITUDE/2
    // At zoom level 2, we would print CIRCUMFERENCE_AT_LATITUDE / 4 spanning across pageSizePixels.x Map scale paperSize.x:CIRCUMFERENCE_AT_LATITUDE/4
    // At zoom level 3, we would print CIRCUMFERENCE_AT_LATITUDE / 8 spanning across pageSizePixels.x Map scale paperSize.x:CIRCUMFERENCE_AT_LATITUDE/8
    
    
    // From https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Resolution_and_Scale:
    // resolution = 156543.03 meters/pixel * cos(latitude) / (2 ^ zoomlevel)
    // scale = 1 : (screen_dpi * 1/0.0254 in/m * resolution)
    // Which gives us
    // 2^zoomlevel = scale * screen_dpi * 1/0.0254 * 156543.03 * cos(latitude)
    const zoom = Math.log((pageSetup.dpi * (1.0 / 0.0254) * 156543.03 * Math.cos(pageSetup.latitude)) / pageSetup.mapScale.worldLengthPerMetreOfPaper ) / Math.log(2)
    console.log('*******************************')
    console.log(pageSizePixels)
    console.log(zoom)
    return {
      pageSizePixels,
      zoom
    }
  }
}

module.exports = CaptureSettings
