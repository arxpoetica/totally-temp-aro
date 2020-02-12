var models = require('../models')
var _ = require('underscore')
var fs = require('fs')
var path = require('path')
var temp = require('temp')

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess
  var cacheable = middleware.cacheable

  var export_dir = temp.mkdirSync('aro_export')

  function timer (interval, tick, end) {
    var time = Date.now()
    function seconds () {
      return Math.floor((Date.now() - time) / 1000)
    }
    var timer = setInterval(() => {
      tick(seconds())
    }, interval * 1000)
    return {
      stop: () => {
        clearInterval(timer)
        end(seconds())
      }
    }
  }

  function exportHandler (request, response, next) {
    var filename = request.query.filename
    var userid = request.user.id
    var t = timer(5,
      (seconds) => {
        console.log('Generating CSV', filename, seconds, 'seconds')
        response.write(seconds + '.')
      },
      (seconds) => console.log('Finished exporting CSV', filename, seconds, 'seconds')
    )
    return (output) => {
      t.stop()
      var fullname = path.join(export_dir, userid + '_' + filename)
      return new Promise((resolve, reject) => {
        fs.writeFile(fullname, output.csv, 'utf8', (err) => {
          if (err) return reject(err)
          response.write('Done')
          response.end()
          resolve()
        })
      })
    }
  }

  api.get('/exported_file', (request, response, next) => {
    var filename = request.query.filename
    var userid = request.user.id
    var fullname = path.join(export_dir, userid + '_' + filename)
    fs.readFile(fullname, 'utf8', (err, output) => {
      if (err) return next(err)
      response.attachment(filename + '.csv')
      response.send(output)
    })
  })

  // Market size filters
  api.get('/market_size/filters', (request, response, next) => {
    models.MarketSize.filters()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Market size calculation
  api.get('/market_size/plan/:plan_id/calculate', cacheable, middleware.viewport, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var type = request.query.type
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type
      },
      viewport: request.viewport
    }
    models.MarketSize.calculate(plan_id, type, options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Fair share calculation
  api.get('/market_size/plan/:plan_id/fair_share', cacheable, middleware.viewport, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var type = request.query.type
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type,
        entity_type: request.query.entity_type
      },
      viewport: request.viewport
    }
    models.MarketSize.fairShare(plan_id, type, options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Export businesses involved in market size calculation
  api.get('/market_size/plan/:plan_id/export', middleware.viewport, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var type = request.query.type
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type
      },
      viewport: request.viewport
    }
    models.MarketSize.exportBusinesses(plan_id, type, options, request.user)
      .then(exportHandler(request, response, next))
      .catch(next)
  })

  api.get('/market_size/business/:business_id', (request, response, next) => {
    var business_id = +request.params.business_id
    var options = {
      filters: {
        product: arr(request.query.product)
      }
    }
    models.MarketSize.marketSizeForBusiness(business_id, options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/market_size/location/:location_id', (request, response, next) => {
    var location_id = +request.params.location_id
    var filters = {
      industry: arr(request.query.industry),
      employees_range: arr(request.query.employees_range),
      product: arr(request.query.product),
      customer_type: request.query.customer_type,
      entity_type: request.query.entity_type
    }
    models.MarketSize.marketSizeForLocation(location_id, filters)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/market_size/plan/:plan_id/location/:location_id/export', (request, response, next) => {
    var plan_id = +request.params.plan_id
    var location_id = +request.params.location_id
    var type = request.query.type
    var options = {
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type
      }
    }
    models.MarketSize.exportBusinessesAtLocation(plan_id, location_id, type, options, request.user)
      .then(exportHandler(request, response, next))
      .catch(next)
  })

  var arr = (value) => _.compact((value || '').split(','))
}
