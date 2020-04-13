const PDFDocument = require('pdfkit')

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
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res)
    const reportPages = req.body
    for (var iReport = 0; iReport < reportPages.length; ++iReport) {
      // Construct a ReportPage object for this report page
      const page = reportPages[iReport]
      const pageSetup = new PageSetup(PaperSize.getPaperSize(page.paperSize), new MapScale(page.worldLengthPerMeterOfPaper),
        page.dpi, page.orientation)
      const reportPage = new ReportPage(pageSetup, page.mapCenter, page.planId, page.visibleLayers)
      const screenshot = await ScreenshotManager.getScreenshotForReportPage(reportPage)
      // PDFKit uses sizes in "PDF points" which is 72 points per inch :(
      const PDF_POINTS_MULTIPLIER = 72 / pageSetup.dpi
      const captureSettings = CaptureSettings.fromPageSetup(reportPage)
      const sizePdfPoints = {
        x: captureSettings.pageSizePixels.x * PDF_POINTS_MULTIPLIER,
        y: captureSettings.pageSizePixels.y * PDF_POINTS_MULTIPLIER
      }
      doc.addPage({ size: [sizePdfPoints.x, sizePdfPoints.y ]})
      doc.image(screenshot, 0, 0, { width: sizePdfPoints.x, height: sizePdfPoints.y })
    }
    doc.end()
  })
}
