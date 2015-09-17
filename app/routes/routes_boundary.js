var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  // Create a boundary
  api.post('/boundary/:route_id/create', check_owner_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    var data = request.body;
    models.Boundary.create_boundary(route_id, data, jsonHandler(response, next));
  });

  // Edit a boundary
  api.post('/boundary/:route_id/edit/:boundary_id', check_owner_permission, function(request, response, next) {
    var data = request.body;
    data.id = request.params.boundary_id;
    data.route_id = request.params.route_id;
    models.Boundary.edit_boundary(data, jsonHandler(response, next));
  });

  // Delete a boundary
  api.post('/boundary/:route_id/delete/:boundary_id', check_owner_permission, function(request, response, next) {
    var route_id = +request.params.route_id;
    var boundary_id = +request.params.boundary_id;
    models.Boundary.delete_boundary(route_id, boundary_id, jsonHandler(response, next));
  });

  // Find boundaries of a network plan
  api.get('/boundary/:route_id/find', check_any_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    models.Boundary.find_boundaries(route_id, jsonHandler(response, next));
  });

};
