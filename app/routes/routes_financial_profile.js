exports.configure = (api, middleware) => {
  var jsonSuccess = middleware.jsonSuccess

  const proxy = (path, params, def) => {
    return Promise.resolve(def)
  }

  api.get('/financial_profile/:plan_id/cash_flow', (request, response, next) => {
    var cashFlow = [
      { year: 2016, bau: 65, fiber: 28, incremental: 90 },
      { year: 2017, bau: 59, fiber: 48, incremental: 27 },
      { year: 2018, bau: 80, fiber: 40, incremental: 86 },
      { year: 2019, bau: 81, fiber: 19, incremental: 19 },
      { year: 2020, bau: 56, fiber: 86, incremental: 40 },
      { year: 2020, bau: 55, fiber: 27, incremental: 48 },
      { year: 2020, bau: 40, fiber: 90, incremental: 28 }
    ]
    proxy('/cash_flow', null, cashFlow)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/budget', (request, response, next) => {
    var budget = [
      { year: 2016, budget: 65, plan: 28 },
      { year: 2017, budget: 59, plan: 48 },
      { year: 2018, budget: 80, plan: 40 },
      { year: 2019, budget: 81, plan: 19 },
      { year: 2020, budget: 56, plan: 86 },
      { year: 2020, budget: 55, plan: 27 },
      { year: 2020, budget: 40, plan: 90 }
    ]
    proxy('/budget', null, budget)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/capex', (request, response, next) => {
    var capex = [
      { year: 2016, network_deployment: 65, connect: 28, maintenance_capacity: 90 },
      { year: 2017, network_deployment: 59, connect: 48, maintenance_capacity: 27 },
      { year: 2018, network_deployment: 80, connect: 40, maintenance_capacity: 86 },
      { year: 2019, network_deployment: 81, connect: 19, maintenance_capacity: 19 },
      { year: 2020, network_deployment: 56, connect: 86, maintenance_capacity: 40 },
      { year: 2020, network_deployment: 55, connect: 27, maintenance_capacity: 48 },
      { year: 2020, network_deployment: 40, connect: 90, maintenance_capacity: 28 }
    ]
    proxy('/capex', null, capex)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/revenue', (request, response, next) => {
    var revenue = [
      { year: 2016, businesses: 65, households: 28, towers: 90 },
      { year: 2017, businesses: 59, households: 48, towers: 27 },
      { year: 2018, businesses: 80, households: 40, towers: 86 },
      { year: 2019, businesses: 81, households: 19, towers: 19 },
      { year: 2020, businesses: 56, households: 86, towers: 40 },
      { year: 2020, businesses: 55, households: 27, towers: 48 },
      { year: 2020, businesses: 40, households: 90, towers: 28 }
    ]
    proxy('/revenue', null, revenue)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/premises', (request, response, next) => {
    var premises = [
      { year: 2016, existing: 65, incremental: 28 },
      { year: 2017, existing: 59, incremental: 48 },
      { year: 2018, existing: 80, incremental: 40 },
      { year: 2019, existing: 81, incremental: 19 },
      { year: 2020, existing: 56, incremental: 86 },
      { year: 2020, existing: 55, incremental: 27 },
      { year: 2020, existing: 40, incremental: 90 }
    ]
    proxy('/premises', null, premises)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/subscribers', (request, response, next) => {
    var subscribers = [
      { year: 2016, bau: 65, fiber: 28, incremental: 90 },
      { year: 2017, bau: 59, fiber: 48, incremental: 27 },
      { year: 2018, bau: 80, fiber: 40, incremental: 86 },
      { year: 2019, bau: 81, fiber: 19, incremental: 19 },
      { year: 2020, bau: 56, fiber: 86, incremental: 40 },
      { year: 2020, bau: 55, fiber: 27, incremental: 48 },
      { year: 2020, bau: 40, fiber: 90, incremental: 28 }
    ]
    proxy('/subscribers', null, subscribers)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/financial_profile/:plan_id/penetration', (request, response, next) => {
    var penetration = [
      { year: 2016, businesses: 65, households: 28, towers: 90 },
      { year: 2017, businesses: 59, households: 48, towers: 27 },
      { year: 2018, businesses: 80, households: 40, towers: 86 },
      { year: 2019, businesses: 81, households: 19, towers: 19 },
      { year: 2020, businesses: 56, households: 86, towers: 40 },
      { year: 2020, businesses: 55, households: 27, towers: 48 },
      { year: 2020, businesses: 40, households: 90, towers: 28 }
    ]
    proxy('/penetration', null, penetration)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
