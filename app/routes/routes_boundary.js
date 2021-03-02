var models = require('../models')
var multer = require('multer')
var os = require('os')
var upload = multer({ dest: os.tmpdir() })

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

  function editUserDefinedBoundary (request, response, next) {
    var name = request.body.name
    var id = request.params.id || null
    var user = request.user
    var radius = +request.body.radius || 20000
    var fullpath = request.file && request.file.path
    models.Boundary.editUserDefinedBoundary(user, id, name, fullpath, radius)
      .then(jsonSuccess(response, next))
      .catch(next)
  }

  // Create a user-defined boundary
  api.post('/boundary/user_defined', upload.single('file'), editUserDefinedBoundary)

  // Edit a user-defined boundary
  api.post('/boundary/user_defined/:id', upload.single('file'), editUserDefinedBoundary)

  // Find the user-defined boundaries of a user
  api.get('/boundary/user_defined', (request, response, next) => {
    var user = request.user
    models.Boundary.findUserDefinedBoundaries(user)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Find both standard and user-defined boundaries
  api.get('/boundary/all', (request, response, next) => {
    var user = request.user
    models.Boundary.findAllBoundaries(user)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
  
  api.post('/boundary/info', (request, response, next) => {
    var serviceAreaIds = request.body.serviceAreaIds
    models.Boundary.getBoundariesInfo(serviceAreaIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/boundary/serviceAreasContainingDataSources', (request, response, next) => {
    var dataSources = request.body.dataSources
    var serviceLayerId = request.body.serviceLayerId
    models.Boundary.getServiceAreasContainingDataSources(dataSources, serviceLayerId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/boundary/for_network_node/:planId/:networkNodeObjectId/:boundaryTypeId', (request, response, next) => {
    const planId = request.params.planId
    const networkNodeObjectId = request.params.networkNodeObjectId
    const boundaryTypeId = request.params.boundaryTypeId
    models.Boundary.getBoundaryForNetworkNode(planId, networkNodeObjectId, boundaryTypeId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
