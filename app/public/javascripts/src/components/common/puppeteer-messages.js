// When the system is loaded in Puppeteer in order to get screenshots (in headless mode), then
// Puppeteer will attach functions to the window object which we can call. When the app is loaded
// in a browser, these functions will not be present.
export default class PuppeteerMessages {
  static vectorTilesDataFetchedCallback () {
    (!PuppeteerMessages.suppressMessages) && window.vectorTilesDataFetchedCallback && window.vectorTilesDataFetchedCallback()
  }

  static vectorTilesRenderedCallback () {
    (!PuppeteerMessages.suppressMessages) && window.vectorTilesRenderedCallback && window.vectorTilesRenderedCallback()
  }

  static googleMapsTilesRenderedCallback () {
    window.googleMapsTilesRenderedCallback && window.googleMapsTilesRenderedCallback()
  }
}

PuppeteerMessages.suppressMessages = true
