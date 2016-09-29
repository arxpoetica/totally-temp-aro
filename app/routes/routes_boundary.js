var models = require('../models')

exports.configure = (api, middleware) => {
  var check_any_permission = middleware.check_any_permission
  var check_owner_permission = middleware.check_owner_permission
  var jsonSuccess = middleware.jsonSuccess

  // Create a boundary
  api.post('/boundary/:plan_id/create', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var data = request.body
    models.Boundary.createBoundary(plan_id, data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Edit a boundary
  api.post('/boundary/:plan_id/edit/:boundary_id', check_owner_permission, (request, response, next) => {
    var data = request.body
    data.id = request.params.boundary_id
    data.plan_id = request.params.plan_id
    models.Boundary.editBoundary(data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Delete a boundary
  api.post('/boundary/:plan_id/delete/:boundary_id', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var boundary_id = +request.params.boundary_id
    models.Boundary.deleteBoundary(plan_id, boundary_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Find boundaries of a network plan
  api.get('/boundary/:plan_id/find', check_any_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.Boundary.findBoundary(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Create a user-defined boundary
  api.post('/boundary/user_defined', (request, response, next) => {
    var name = request.params.name
    var user = request.user
    models.Boundary.editUserDefinedBoundary(user, null, name)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Edit a user-defined boundary
  api.post('/boundary/user_defined/:id', (request, response, next) => {
    var name = request.params.name
    var id = request.params.id
    var user = request.user
    models.Boundary.editUserDefinedBoundary(user, id, name)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Find the user-defined boundaries of a user
  api.get('/boundary/user_defined', (request, response, next) => {
    var user = request.user
    models.Boundary.findUserDefinedBoundaries(user)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
