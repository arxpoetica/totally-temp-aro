var helpers = require('../helpers')
var pify = require('pify')
var config = helpers.config

var request = pify(require('request'), { multiArgs: true })

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  const proxy = (path, params) => {
    var req = {
      url: config.aro_service_url + `/rest/financial_profile/${params.plan_id}/${path}`,
      json: true
    }
    return request(req).then((result) => {
      var res = result[0]
      if (res.statusCode !== 200) {
        console.log('aro-service returned', res.statusCode, 'for request', JSON.stringify(req, null, 2), 'response', JSON.stringify(result[1], null, 2))
        return []
      }
      var body = result[1]
      console.log('aro-service returned', body)
      return body
    })
    .catch((err) => {
      console.log(err)
      return []
    })
  }

  api.get('/financial_profile/:plan_id/cash_flow', (request, response, next) => {
    proxy('cash_flow', { plan_id: request.params.plan_id })
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/budget', (request, response, next) => {
    var budget = [
      { year: 2016, budget: 2500, plan: 2220 },
      { year: 2017, budget: 2500, plan: 2220 },
      { year: 2018, budget: 2500, plan: 2220 },
      { year: 2019, budget: 0, plan: 0 },
      { year: 2020, budget: 0, plan: 0 },
      { year: 2020, budget: 0, plan: 0 },
      { year: 2021, budget: 0, plan: 0 },
      { year: 2022, budget: 0, plan: 0 },
      { year: 2023, budget: 0, plan: 0 },
      { year: 2024, budget: 0, plan: 0 },
      { year: 2025, budget: 0, plan: 0 },
      { year: 2026, budget: 0, plan: 0 },
      { year: 2027, budget: 0, plan: 0 },
      { year: 2028, budget: 0, plan: 0 },
      { year: 2029, budget: 0, plan: 0 },
      { year: 2030, budget: 0, plan: 0 }
    ]
    proxy('budget', { plan_id: request.params.plan_id }, budget)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/capex', (request, response, next) => {
    proxy('capex', { plan_id: request.params.plan_id })
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/revenue', (request, response, next) => {
    proxy('revenue', { plan_id: request.params.plan_id })
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/premises', (request, response, next) => {
    proxy('premises', { plan_id: request.params.plan_id })
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/subscribers', (request, response, next) => {
    proxy('subscribers', { plan_id: request.params.plan_id })
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/penetration', (request, response, next) => {
    proxy('penetration', { plan_id: request.params.plan_id })
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
