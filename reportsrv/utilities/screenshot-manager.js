const puppeteer = require('puppeteer')
const config = require('../helpers/config')

class ScreenshotManager {
  static async getScreenshotForCaptureSettings (captureSettings, cookies) {
    const browser = await puppeteer.launch({
      args: [
        // Required for Docker version of Puppeteer
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // This will write shared memory files into /tmp instead of /dev/shm,
        // because Docker’s default for /dev/shm is 64MB
        '--disable-dev-shm-usage',
        `--window-size=${captureSettings.browserWindowSize.x},${captureSettings.browserWindowSize.y}`
      ]
    });
    const page = await browser.newPage()
    // Convert the cookies to a format that puppeteer uses
    var cookiesArray = Object.keys(cookies).map(cookieName => ({
      name: cookieName,
      value: cookies[cookieName],
      url: config.APP_BASE_URL
    }))
    await page.setCookie(...cookiesArray)
    page.on('console', msg => {
      const type = msg.type()
      if (type === 'warning' || type === 'error') {
        console.log(`BROWSER: ${msg.type()}: ${msg.text()}`)
      }
    });
    await page._client.send('Emulation.clearDeviceMetricsOverride')
    const reportPageWithZoom = JSON.parse(JSON.stringify(captureSettings.reportPage))
    reportPageWithZoom.mapZoom = captureSettings.zoom
    const url = `${config.APP_BASE_URL}?reportPage=${JSON.stringify(reportPageWithZoom)}`
    if (url.length > 2000) {
      throw new Exception(`ERROR: URL length is ${url.length}, cannot exceed 2000 characters. Unable to get a report with these parameters`)
    }
    await page.goto(url)

    const sleep = m => new Promise(r => setTimeout(r, m))
    await sleep(10000)
    const screenshot = await page.screenshot({ encoding: 'binary' })
    await browser.close()
    return screenshot
  }
}

module.exports = ScreenshotManager