var models = require('../models');
var request = require('request');

exports.configure = function(app, middleware) {

  // For testing the error handler
  app.get('/error', function(request, response, next) {
    next(new Error('test'));
  });

  // error handler
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
      error: err.message,
    });

    if (process.env.NODE_ENV === 'production') {
      var base_url = process.env.APP_BASE_URL || 'Unknown'
      var webhook = process.env.SLACK_WEBHOOK || 'https://hooks.slack.com/services/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'
      var text = err.stack || err.message || String(err)
      text += '\nBase URL: '+base_url
      var opts = {
        url: webhook,
        body: JSON.stringify({
          text: text,
        })
      };
      request(opts, function(err, res, body) {
        if (err) return console.log('Error while sending slack message', err, body)
      });
    }
  });

};
