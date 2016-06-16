var helpers = require('../helpers')
var pify = require('pify')
var config = helpers.config

var request = pify(require('request'), { multiArgs: true })

exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  const proxy = (path, params, def) => {
    var req = {
      url: config.aro_service_url + `/rest/financial_profile/${params.plan_id}/${path}`,
      json: true
    }
    console.log('req', req)
    return request(req).then((result) => {
      var res = result[0]
      if (res.statusCode !== 200) {
        console.log('aro-service returned', res.statusCode)
        return def
      }
      var body = result[1]
      console.log('aro-service returned', body)
      return body
    })
    .catch((err) => {
      console.log(err)
      return def
    })
  }

  api.get('/financial_profile/:plan_id/cash_flow', (request, response, next) => {
    var cashFlow = [
      { year: 2016, bau: 3337, fiber: 848, incremental: -4829 },
      { year: 2017, bau: 3003, fiber: 452, incremental: -2551 },
      { year: 2018, bau: 2669, fiber: 890, incremental: -1779 },
      { year: 2019, bau: 2336, fiber: 3318, incremental: 982 },
      { year: 2020, bau: 2002, fiber: 3623, incremental: 1621 },
      { year: 2021, bau: 1624, fiber: 3747, incremental: 2123 },
      { year: 2022, bau: 1291, fiber: 3759, incremental: 2468 },
      { year: 2023, bau: 957, fiber: 3771, incremental: 2814 },
      { year: 2024, bau: 623, fiber: 3783, incremental: 3160 },
      { year: 2025, bau: 557, fiber: 3862, incremental: 3305 },
      { year: 2026, bau: 490, fiber: 3940, incremental: 3450 },
      { year: 2027, bau: 423, fiber: 4019, incremental: 3596 },
      { year: 2028, bau: 356, fiber: 4098, incremental: 3741 },
      { year: 2029, bau: 290, fiber: 4176, incremental: 3887 },
      { year: 2030, bau: 223, fiber: 4225, incremental: 4032 }
    ]
    proxy('cash_flow', { plan_id: request.params.plan_id }, cashFlow)
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
    var capex = [
      { year: 2016, network_deployment: 2220, connect: 269, maintenance_capacity: 149 },
      { year: 2017, network_deployment: 2220, connect: 291, maintenance_capacity: 140 },
      { year: 2018, network_deployment: 2220, connect: 225, maintenance_capacity: 165 },
      { year: 2019, network_deployment: 0, connect: 154, maintenance_capacity: 177 },
      { year: 2020, network_deployment: 0, connect: 66, maintenance_capacity: 192 },
      { year: 2021, network_deployment: 0, connect: 44, maintenance_capacity: 198 },
      { year: 2022, network_deployment: 0, connect: 44, maintenance_capacity: 199 },
      { year: 2023, network_deployment: 0, connect: 44, maintenance_capacity: 200 },
      { year: 2024, network_deployment: 0, connect: 44, maintenance_capacity: 201 },
      { year: 2025, network_deployment: 0, connect: 44, maintenance_capacity: 206 },
      { year: 2026, network_deployment: 0, connect: 44, maintenance_capacity: 210 },
      { year: 2027, network_deployment: 0, connect: 44, maintenance_capacity: 214 },
      { year: 2028, network_deployment: 0, connect: 44, maintenance_capacity: 218 },
      { year: 2029, network_deployment: 0, connect: 44, maintenance_capacity: 222 },
      { year: 2030, network_deployment: 0, connect: 44, maintenance_capacity: 226 }
    ]
    proxy('capex', { plan_id: request.params.plan_id }, capex)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/revenue', (request, response, next) => {
    var revenue = [
      { year: 2016, households: 4500, businesses: 480, towers: 0 },
      { year: 2017, households: 4140, businesses: 504, towers: 30 },
      { year: 2018, households: 4800, businesses: 642, towers: 60 },
      { year: 2019, households: 5100, businesses: 726, towers: 90 },
      { year: 2020, households: 5490, businesses: 804, towers: 90 },
      { year: 2021, households: 5670, businesses: 839, towers: 90 },
      { year: 2022, households: 5700, businesses: 847, towers: 90 },
      { year: 2023, households: 5730, businesses: 856, towers: 90 },
      { year: 2024, households: 5760, businesses: 864, towers: 90 },
      { year: 2025, households: 5880, businesses: 882, towers: 90 },
      { year: 2026, households: 6000, businesses: 900, towers: 90 },
      { year: 2027, households: 6120, businesses: 918, towers: 90 },
      { year: 2028, households: 6240, businesses: 936, towers: 90 },
      { year: 2029, households: 6360, businesses: 954, towers: 90 },
      { year: 2030, households: 6480, businesses: 972, towers: 90 }
    ]
    proxy('revenue', { plan_id: request.params.plan_id }, revenue)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/premises', (request, response, next) => {
    var premises = [
      { year: 2016, incremental: 3333, existing: 0 },
      { year: 2017, incremental: 6667, existing: 0 },
      { year: 2018, incremental: 10000, existing: 0 },
      { year: 2019, incremental: 10000, existing: 0 },
      { year: 2020, incremental: 10000, existing: 0 },
      { year: 2021, incremental: 10000, existing: 0 },
      { year: 2022, incremental: 10000, existing: 0 },
      { year: 2023, incremental: 10000, existing: 0 },
      { year: 2024, incremental: 10000, existing: 0 },
      { year: 2025, incremental: 10000, existing: 0 },
      { year: 2026, incremental: 10000, existing: 0 },
      { year: 2027, incremental: 10000, existing: 0 },
      { year: 2028, incremental: 10000, existing: 0 },
      { year: 2029, incremental: 10000, existing: 0 },
      { year: 2030, incremental: 10000, existing: 0 }
    ]
    proxy('premises', { plan_id: request.params.plan_id }, premises)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/subscribers', (request, response, next) => {
    var subscribers = [
      { year: 2016, bau: 5000, fiber: 5000 },
      { year: 2017, bau: 4500, fiber: 4200 },
      { year: 2018, bau: 4000, fiber: 4500 },
      { year: 2019, bau: 3500, fiber: 4500 },
      { year: 2020, bau: 3000, fiber: 4700 },
      { year: 2021, bau: 2500, fiber: 4800 },
      { year: 2022, bau: 2000, fiber: 4800 },
      { year: 2023, bau: 1500, fiber: 4800 },
      { year: 2024, bau: 1000, fiber: 4800 },
      { year: 2025, bau: 900, fiber: 4900 },
      { year: 2026, bau: 800, fiber: 5000 },
      { year: 2027, bau: 700, fiber: 5100 },
      { year: 2028, bau: 600, fiber: 5200 },
      { year: 2029, bau: 500, fiber: 5300 },
      { year: 2030, bau: 400, fiber: 5400 }
    ]
    proxy('subscribers', { plan_id: request.params.plan_id }, subscribers)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/penetration', (request, response, next) => {
    var penetration = [
      { year: 2016, businesses: 0, households: 0, towers: 0 },
      { year: 2017, businesses: 12, households: 12, towers: 5 },
      { year: 2018, businesses: 25, households: 25, towers: 10 },
      { year: 2019, businesses: 35, households: 35, towers: 15 },
      { year: 2020, businesses: 42, households: 42, towers: 15 },
      { year: 2021, businesses: 45, households: 45, towers: 15 },
      { year: 2022, businesses: 46, households: 46, towers: 15 },
      { year: 2023, businesses: 47, households: 47, towers: 15 },
      { year: 2024, businesses: 48, households: 48, towers: 15 },
      { year: 2025, businesses: 49, households: 49, towers: 15 },
      { year: 2026, businesses: 50, households: 50, towers: 15 },
      { year: 2027, businesses: 51, households: 51, towers: 15 },
      { year: 2028, businesses: 52, households: 52, towers: 15 },
      { year: 2029, businesses: 53, households: 53, towers: 15 },
      { year: 2030, businesses: 54, households: 54, towers: 15 }
    ]
    proxy('penetration', { plan_id: request.params.plan_id }, penetration)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
