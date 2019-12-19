const PDFDocument = require('pdfkit')
const fs = require('fs')
const os = require('os')
const uuidv4 = require('uuid/v4')

const MapScale = require('../models/map-scale')
const PaperSize = require('../models/paper-size')
const PageSetup = require('../models/page-setup')
const CaptureSettings = require('../models/capture-settings')
const ReportPage = require('../models/report-page')
const ScreenshotManager = require('../utilities/screenshot-manager')

exports.configure = api => {
  // Sample body
  // [
  //   {
  //     "paperSize": "A4",
  //     "worldLengthPerMeterOfPaper": 100000,
  //     "dpi": 72,
  //     "orientation": "portrait",
  //     "mapCenter": {
  //       "latitude": 47.6062,
  //       "longitude": -122.3321
  //     },
  //     "planId": 3,
  //     "visibleLayers": ["small_business"]
  //   }
  // ]
  api.post('/report', async (req, res, next) => {
    const doc = new PDFDocument({ autoFirstPage: false })
    const PDF_FILE = os.tmpdir() + '/' + uuidv4() + '.pdf'
    const writeStream = fs.createWriteStream(PDF_FILE)
    doc.pipe(writeStream)
    const reportPages = req.body
    for (var iReport = 0; iReport < reportPages.length; ++iReport) {
      // Construct a ReportPage object for this report page
      const page = reportPages[iReport]
      const pageSetup = new PageSetup(PaperSize.getPaperSize(page.paperSize), new MapScale(page.worldLengthPerMeterOfPaper),
        page.dpi, page.orientation, page.latitude)
      const reportPage = new ReportPage(pageSetup, page.mapCenter, page.planId, page.visibleLayers)
      const screenshot = await ScreenshotManager.getScreenshotForReportPage(reportPage)
      // PDFKit uses sizes in "PDF points" which is 72 points per inch :(
      const PDF_POINTS_MULTIPLIER = 72 / pageSetup.dpi
      const captureSettings = CaptureSettings.fromPageSetup(reportPage.pageSetup)
      const sizePdfPoints = {
        x: captureSettings.pageSizePixels.x * PDF_POINTS_MULTIPLIER,
        y: captureSettings.pageSizePixels.y * PDF_POINTS_MULTIPLIER
      }
      doc.addPage({ size: [sizePdfPoints.x, sizePdfPoints.y ]})
      doc.image(screenshot, 0, 0, { width: sizePdfPoints.x, height: sizePdfPoints.y })
    }
    doc.end()
    await new Promise((resolve, reject) => writeStream.on('finish', err => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        resolve()
      }
    }))
    const stats = fs.statSync(PDF_FILE)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.sendFile(PDF_FILE, err => {
      if (err) {
        console.error(err)
        next()
      }
      // File has been sent, delete it
      fs.unlink(PDF_FILE, () => console.log(`File ${PDF_FILE} deleted`))
    })
  })
}
