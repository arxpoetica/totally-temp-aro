var helpers = require('../helpers')
var models = require('../models')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  function contains(arr, value) {
    if (typeof arr === 'string') {
      return arr === value
    }
    return Array.isArray(arr) && arr.indexOf(value) >= 0
  }

  api.get('/financial_profile/:plan_id/cash_flow', (request, response, next) => {
    requestData({
      plan_id: request.params.plan_id,
      curves: {
        bau: 'copper.network.cashflow',
        plan: 'planned.network.cashflow',
        incremental: 'incremental.network.cashflow'
      }
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/budget', (request, response, next) => {
    jsonSuccess([], next)
  })

  api.get('/financial_profile/:plan_id/capex', (request, response, next) => {
    var curves = {
      bau: {
        network_deployment: 'copper.network.cost',
        connect: 'copper.network.new_connections_cost',
        maintenance_capacity: 'copper.network.maintenance_expenses'
      },
      plan: {
        network_deployment: 'planned.network.cost',
        connect: 'planned.network.new_connections_cost',
        maintenance_capacity: 'planned.network.maintenance_expenses'
      },
      incremental: {
        network_deployment: 'incremental.network.cost',
        connect: 'incremental.network.new_connections_cost',
        maintenance_capacity: 'incremental.network.maintenance_expenses'
      }
    }
    requestData({
      plan_id: request.params.plan_id,
      curves: curves[request.query.filter]
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/revenue', (request, response, next) => {
    var curves = {
      bau: 'copper.household.revenue',
      plan: 'planned.network.revenue',
      incremental: 'incremental.network.revenue'
    }
    requestData({
      plan_id: request.params.plan_id,
      curves: {
        households: curves[request.query.filter]
      },
      zeros: ['businesses', 'towers']
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/premises', (request, response, next) => {
    var curves = {}
    var zeros = ['incremental', 'existing']
    if (contains(request.query.entityTypes, 'households')) {
      curves = {
        incremental: 'fiber.household.premises_passed'
      }
      zeros = ['existing']
    }
    requestData({
      plan_id: request.params.plan_id,
      curves: curves,
      zeros: zeros
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/subscribers', (request, response, next) => {
    var curves = {}
    var zeros = ['bau', 'plan']
    if (request.query.entityType === 'households') {
      curves = {
        bau: 'copper.household.subscribers_count',
        plan: 'planned.network.subscribers_count'
      }
      zeros = []
    }
    requestData({
      plan_id: request.params.plan_id,
      curves: curves,
      zeros: zeros
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/penetration', (request, response, next) => {
    requestData({
      plan_id: request.params.plan_id,
      curves: {
        households: 'fiber.household.subscribers_penetration'
      },
      zeros: ['businesses', 'towers']
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })
}

const requestData = (params) => {
  var year = new Date().getFullYear()
  var select = Object.keys(params.curves).map((key) => params.curves[key])
  var chart = []
  if (select.length === 0) {
    while (year < 2031) {
      var obj = { year: year++ }
      params.zeros.forEach((key) => {
        obj[key] = 0
      })
      chart.push(obj)
    }
    return Promise.resolve(chart)
  }
  var req = {
    url: config.aro_service_url + `/rest/roic/models/${params.plan_id}`,
    qs: { '$select': select.join(',') },
    json: true
  }
  return models.AROService.request(req)
    .then((result) => {
      Object.keys(params.curves).forEach((key) => {
        var name = params.curves[key]
        var item = result.find((item) => item.name === name)
        if (!item) return console.log('No curve found', name)
        item.values.forEach((value, i) => {
          var obj = chart[i]
          if (!obj) {
            obj = { year: year++ }
            chart.push(obj)
          }
          obj[key] = value
        })
      })
      ;(params.zeros || []).forEach((key) => {
        chart.forEach((obj) => {
          obj[key] = 0
        })
      })
      return chart
    })
}
