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
      var reader = new FileReader()
      reader.onload = function (e) {
        const contents = e.target.result
        // Split by lines
        var lines = contents.split(/\r?\n/) // NOTE: Has to accept both Windows and Linux line endings
        const firstLine = lines.splice(0, 1)[0] // The first line is assumed to be a column header, ignore it
        if (!firstLine.includes('id,latitude,longitude')) {
          throw new Error('In RfpFileImporter: The csv file format is incorrect. The first line must have atleast "id,latitude,longitude"')
        }
        var targets = lines
          .filter(line => line) // Ignore null or empty strings
          .map(line => {
            const columns = line.split(',')
            return new Point(+columns[1], +columns[2], columns[0])
          })
        resolve(targets)
      }
      reader.readAsText(file)
    })
  }
}
