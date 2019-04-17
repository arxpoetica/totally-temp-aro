const models = require('../models')
const helpers = require('../helpers')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/ui_settings', (req, res, next) => {
    models.UiSettings.getSettingsForClient(process.env.ARO_CLIENT)
      .then(jsonSuccess(res, next))
      .catch(next)
  })

  api.post('/ui_settings/save/:settingType', (req, res, next) => {
    const settingType = req.params.settingType
    const settingValue = req.body.configuration
    models.UiSettings.saveSettings(process.env.ARO_CLIENT, settingType, settingValue)
      .then(() => {
        // Make sure we reload updated configurations
        helpers.cache.clearUiConfigurationCache()
        helpers.cache.refresh()
      })
      .then(jsonSuccess(res, next))
      .catch(next)
  })
}