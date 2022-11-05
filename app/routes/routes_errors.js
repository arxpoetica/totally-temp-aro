import request from 'request'

export const configure = (app, middleware) => {
  // For testing the error handler
  app.get('/error', (request, response, next) => {
    next(new Error('test'))
  })

  // error handler
  app.use((err, req, res, next) => {
    console.log(err)
    res.status(err.status).json(err.body)

    if (process.env.NODE_ENV === 'production') {
      var base_url = process.env.APP_BASE_URL || 'Unknown'
      var webhook = process.env.SLACK_WEBHOOK || 'https://hooks.slack.com/services/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'
      var text = err.stack || err.message || String(err)
      text += '\nBase URL: ' + base_url
      var opts = {
        url: webhook,
        body: JSON.stringify({
          text: text
        })
      }
      request(opts, (err, res, body) => {
        if (err) return console.log('Error while sending slack message', err, body)
      })
    }
  })
}
