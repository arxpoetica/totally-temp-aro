const models = require('../models')
const multer = require('multer')
const os = require('os')
const upload = multer({ dest: os.tmpdir() })
const fs = require('fs')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  // Get a binary UI asset from the database
  api.get('/ui_assets/:assetKey', (request, response, next) => {
    const assetKey = request.params.assetKey
    models.UiAssets.getAssetByKey(assetKey)
      .then((binaryData) => {
        // Send the binary data as-is to the client
        response.write(binaryData, 'binary')
        response.end(null, 'binary')
      })
      .catch(next)
  })

  // Get a list of all asset keys from the database
  api.get('/ui_assets/list/assetKeys', (request, response, next) => {
    const offset = request.query.offset || 0
    const limit = request.query.limit || 10
    models.UiAssets.getAssetKeys(offset, limit)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Save a binary UI asset into the database
  api.post('/ui_assets/:assetKey', upload.single('file'), (request, response, next) => {
    const assetKey = request.params.assetKey
    const data = fs.readFileSync(request.file.path)
    models.UiAssets.saveAsset(assetKey, data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
