import UiSettings from '../models/ui_settings.js'
import cache from '../helpers/cache.cjs'

export const configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  api.get('/ui_settings', (req, res, next) => {
    UiSettings.getSettingsForClient(process.env.ARO_CLIENT)
      .then(jsonSuccess(res, next))
      .catch(next)
  })

  function getStylesheetsForClient (request, response, next) {
    UiSettings.getStylesheetsForClient(process.env.ARO_CLIENT)
      .then((cssData) => {
        response.writeHead(200, { 'Content-type': 'text/css' })
        cssData && response.write(cssData)
        response.end()
      })
      .catch(next)
  }

  api.get('/ui_stylesheets', getStylesheetsForClient)

  api.post('/ui_settings/save/:settingType', (req, res, next) => {
    const settingType = req.params.settingType
    const settingValue = req.body.configuration
    UiSettings.saveSettings(process.env.ARO_CLIENT, settingType, settingValue)
      .then(() => {
        // Make sure we reload updated configurations
        cache.clearUiConfigurationCache()
        cache.refresh()
      })
      .then(jsonSuccess(res, next))
      .catch(next)
  })

  api.post('/ui_stylesheets', (req, res, next) => {
    const stylesheetsValue = req.body.configuration
    UiSettings.savestylesheet(process.env.ARO_CLIENT, stylesheetsValue)
      .then(jsonSuccess(res, next))
      .catch(next)
  })

  api.get('/ui/rfp_templates', (req, res, next) => {
    UiSettings.getAllRfpTemplates()
      .then(jsonSuccess(res, next))
      .catch(next)
  })

  api.post('/ui/rfp_template', (req, res, next) => {
    UiSettings.createRfpTemplate(req.body)
      .then(jsonSuccess(res, next))
      .catch(next)
  })

  api.delete('/ui/rfp_template/:id', (req, res, next) => {
    const templateId = req.params.id
    UiSettings.deleteRfpTemplate(templateId)
      .then(jsonSuccess(res, next))
      .catch(next)
  })
}
