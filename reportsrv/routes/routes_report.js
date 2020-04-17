const PDFDocument = require('pdfkit')

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
      const reportPage = new ReportPage(page.paperSize, page.worldLengthPerMeterOfPaper, page.dpi,
        page.orientation, page.mapCenter, page.planId, page.visibleLayers)
      // PDFKit uses sizes in "PDF points" which is 72 points per inch :(
      const paperDimensions = reportPage.getPaperDimensions()
      const METERS_TO_PDF_POINTS = 39.3701 * 72
      const widthPdfPoints = paperDimensions.x * METERS_TO_PDF_POINTS
      const heightPdfPoints = paperDimensions.y * METERS_TO_PDF_POINTS
      doc.addPage({ size: [widthPdfPoints, heightPdfPoints]})
      const captureSettings = CaptureSettings.fromPageSetup(reportPage)
      for (var iSetting = 0; iSetting < captureSettings.length; ++iSetting) {
        const captureSetting = captureSettings[iSetting]
        console.log(captureSetting)
        const screenshot = await ScreenshotManager.getScreenshotForCaptureSettings(captureSetting)
        doc.image(screenshot, captureSetting.left * widthPdfPoints, captureSetting.top * widthPdfPoints,
          { width: captureSetting.width * widthPdfPoints, height: captureSetting.height * heightPdfPoints })
      }
    }
    doc.end()
  })
}
