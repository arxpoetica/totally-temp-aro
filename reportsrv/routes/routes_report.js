const puppeteer = require('puppeteer')
const PDFDocument = require('pdfkit')
const fs = require('fs')

const MapScale = require('../models/map-scale')
const PaperSize = require('../models/paper-size')
const PageSetup = require('../models/page-setup')
const Orientation = require('../models/orientation')
const CaptureSettings = require('../models/capture-settings')

exports.configure = api => {
  api.get('/report', async (request, response, next) => {
    const pageSetup = new PageSetup(PaperSize.getPaperSize('A4'), new MapScale(100000), 300, Orientation.PORTRAIT)
    const captureSettings = CaptureSettings.fromPageSetup(pageSetup)
    console.log(captureSettings.pageSizePixels)

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
    },
    {
      name: 'session',
      value: 'eyJmbGFzaCI6e30sInBhc3Nwb3J0Ijp7InVzZXIiOnsiaWQiOjQsIm11bHRpRmFjdG9yQXV0aGVudGljYXRpb25Eb25lIjp0cnVlLCJ2ZXJzaW9uIjoiMSJ9fX0=',
      url: 'http://app_upgrade2:8000/'
    })
    // page.on('console', msg => console.log('PAGE LOG:', msg));
    await page._client.send('Emulation.clearDeviceMetricsOverride')
    await page.goto('http://app_upgrade2:8000/')
    const sleep = m => new Promise(r => setTimeout(r, m))
    await sleep(3000)
    await page.screenshot({ path: 'example.png' })
    await browser.close()
    const doc = new PDFDocument({ autoFirstPage: false })
    doc.pipe(fs.createWriteStream('output.pdf'))
    console.log(captureSettings)
    // PDFKit uses sizes in "PDF points" which is 72 points per inch :(
    console.log(pageSetup.dpi)
    const PDF_POINTS_MULTIPLIER = 72 / pageSetup.dpi
    const sizePdfPoints = {
      x: captureSettings.pageSizePixels.x * PDF_POINTS_MULTIPLIER,
      y: captureSettings.pageSizePixels.y * PDF_POINTS_MULTIPLIER
    }
    doc.addPage({ size: [sizePdfPoints.x, sizePdfPoints.y ]})
    doc.image('example.png', 0, 0, { width: sizePdfPoints.x, height: sizePdfPoints.y })
    doc.end()
    response.sendFile(__dirname + '/output.pdf')
  })
}
