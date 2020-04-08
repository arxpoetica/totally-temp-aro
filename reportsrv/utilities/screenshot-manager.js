const puppeteer = require('puppeteer')

const CaptureSettings = require('../models/capture-settings')

class ScreenshotManager {
  static async getScreenshotForReportPage (reportPage, latitude) {
    const captureSettings = CaptureSettings.fromPageSetup(reportPage.pageSetup, latitude)
    const browser = await puppeteer.launch({
      args: [
        // Required for Docker version of Puppeteer
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // This will write shared memory files into /tmp instead of /dev/shm,
        // because Docker’s default for /dev/shm is 64MB
        '--disable-dev-shm-usage',
        `--window-size=${captureSettings.pageSizePixels.x},${captureSettings.pageSizePixels.y}`
      ]
    });
    const page = await browser.newPage()
    await page.setCookie({
      name: 'session',
      value: 'eyJmbGFzaCI6e30sInBhc3Nwb3J0Ijp7InVzZXIiOnsiaWQiOjQsIm11bHRpRmFjdG9yQXV0aGVudGljYXRpb25Eb25lIjp0cnVlLCJ2ZXJzaW9uIjoiMSJ9fX0=',
      url: 'http://app_upgrade2:8000/'
    },
    {
      name: 'session.sig',
      value: 'C9WVxl_FnwNUNFZ5dHkJw8bJT5s',
      url: 'http://app_upgrade2:8000/'
    })
    page.on('console', msg => {
      const type = msg.type()
      if (type === 'warning' || type === 'error') {
        console.log(`BROWSER: ${msg.type()}: ${msg.text()}`)
      }
    });
    await page._client.send('Emulation.clearDeviceMetricsOverride')
    const reportPageWithZoom = JSON.parse(JSON.stringify(reportPage))
    reportPageWithZoom.mapZoom = captureSettings.zoom
    const url = `http://app_upgrade2:8000?reportPage=${JSON.stringify(reportPageWithZoom)}`
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