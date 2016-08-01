var helpers = require('../helpers')
var models = require('../models')
var moment = require('moment')
var config = helpers.config

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  function contains (arr, value) {
    if (typeof arr === 'string') {
      return arr === value
    }
    return Array.isArray(arr) && arr.indexOf(value) >= 0
  }

  function array (value) {
    if (value == null) return []
    if (!Array.isArray(value)) return [value]
    return value
  }

  api.get('/financial_profile/:plan_id/export', (request, response, next) => {
    var req = {
      url: config.aro_service_url + `/rest/roic/models/${request.params.plan_id}.csv`
    }
    return models.AROService.request(req)
      .then((output) => {
        response.attachment(`financial_profile_${moment().format('YYYY-MM-DD_HH:mm:ss')}.csv`)
        response.send(output)
      })
  })

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
    var filter = request.query.filter === 'bau' ? 'copper' : 'planned'
    var curves = {}
    var entityTypes = ['smallBusiness', 'mediumBusiness', 'largeBusiness', 'household', 'cellTower']
    entityTypes.forEach((key) => {
      curves[key] = `${filter}.${key}.revenue`
    })
    requestData({
      plan_id: request.params.plan_id,
      curves: curves
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/premises', (request, response, next) => {
    var entities = array(request.query.entityTypes)
    if (entities.length === 0) return response.json([])
    var curves = {}
    entities.forEach((key) => {
      curves[key] = `fiber.${key}.premises_passed`
    })
    var percentage = request.query.percentage === 'true'
    if (percentage) {
      curves['household_count'] = 'planned.household.houseHolds_global_count'
    }
    var zeros = ['existing']
    requestData({
      plan_id: request.params.plan_id,
      curves: curves,
      zeros: zeros
    })
    .then((data) => {
      data.forEach((obj) => {
        if (percentage) {
          obj.incremental = obj['household'] * 100 / obj['household_count']
        } else {
          var n = 0
          Object.keys(curves).forEach((key) => {
            n += obj[key]
          })
          obj.incremental = n
        }
      })
      return data
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/subscribers', (request, response, next) => {
    var curves = {}
    var zeros = []
    var entities = array(request.query.entityTypes)
    if (entities.length === 0) return response.json([])
    entities.forEach((key) => {
      curves[`bau_${key}`] = `copper.${key}.subscribers_count`
      curves[`plan_${key}`] = `planned.${key}.subscribers_count`
    })
    if (entities.length === 0) {
      zeros = ['bau', 'plan']
    }
    requestData({
      plan_id: request.params.plan_id,
      curves: curves,
      zeros: zeros
    })
    .then((data) => {
      data.forEach((obj) => {
        var bau = 0
        var plan = 0
        Object.keys(curves).forEach((key) => {
          if (key.indexOf('bau_') === 0) {
            bau += obj[key]
          } else {
            plan += obj[key]
          }
        })
        obj.bau = bau
        obj.plan = bau
      })
      return data
    })
    .then(jsonSuccess(response, next))
    .catch(next)
  })

  api.get('/financial_profile/:plan_id/penetration', (request, response, next) => {
    var entityType = request.query.entityType
    var curves = {
      bau: `copper.${entityType}.subscribers_penetration`,
      plan: `planned.${entityType}.subscribers_penetration`
    }
    var zeros = []
    requestData({
      plan_id: request.params.plan_id,
      curves: curves,
      zeros: zeros
    }, (value) => value * 100)
    .then(jsonSuccess(response, next))
    .catch(next)
  })
}

const requestData = (params, filter) => {
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
          obj[key] = (filter && filter(value)) || value
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
