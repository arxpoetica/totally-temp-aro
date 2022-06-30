/* globals FileReader */
import Point from '../../../common/point'
const MAX_FILE_SIZE_IN_BYTES = 1000000

export default class RfpPointImporterUtils {
  static loadPointsFromFile (file) {
    return new Promise((resolve, reject) => {

      if (!file) {
        reject(new Error('No file selected'))
      }
      if (file.size > MAX_FILE_SIZE_IN_BYTES) {
        reject(new Error(`File too large. Maximum file size for selecting targets is ${MAX_FILE_SIZE_IN_BYTES} bytes.`))
      }

      const reader = new FileReader()
      reader.onload = function (event) {
        const contents = event.target.result
        const lines = contents.split(/\r?\n/) // NOTE: Has to accept both Windows and Linux line endings
        const firstLine = lines.splice(0, 1)[0] // The first line is assumed to be a column header, ignore it
        if (!firstLine.includes('id,latitude,longitude')) {
          throw new Error('In RfpFileImporter: The csv file format is incorrect. The first line must have atleast "id,latitude,longitude"')
        }
        const [idHead, latHead, lngHead, ...headerProps] = firstLine.split(',')
        const targets = lines
          .filter(line => line) // Ignore null or empty strings
          .map(line => {
            const columns = line.split(',')
            const [id, lat, lng, ...valueProps] = columns
            // creating a hashmap of headers and their value in each line:
            const headerValueMap = {}
            headerProps.forEach((header, idx) => headerValueMap[header] = valueProps[idx])
            const newPoint = new Point(+lat, +lng, id, headerValueMap)
            return newPoint
          })
        resolve(targets)
      }
      reader.readAsText(file)
    })
  }
}
