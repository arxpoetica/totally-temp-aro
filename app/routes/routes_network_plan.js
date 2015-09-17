var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  // Find all created routes
  api.get('/network_plan/find_all', function(request, response, next) {
    models.NetworkPlan.find_all(request.user, jsonHandler(response, next));
  });

  // Create a new empty route
  api.post('/network_plan/create', function(request, response, next) {
    var name = request.body.name;
    var area = request.body.area;
    models.NetworkPlan.create_route(name, area, request.user, jsonHandler(response, next));
  });

  // Return data of an existing route
  api.get('/network_plan/:route_id', check_any_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    models.NetworkPlan.find_route(route_id, jsonHandler(response, next));
  });

  // Return the metadata of an existing route
  api.get('/network_plan/:route_id/metadata', check_any_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    models.NetworkPlan.find_route(route_id, true, jsonHandler(response, next));
  });

  // Edits the route of an existing network plan
  api.post('/network_plan/:route_id/edit', check_owner_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    var changes = request.body;
    models.NetworkPlan.edit_route(route_id, changes, jsonHandler(response, next));
  });

  // Edits basic information of an existing route
  api.post('/network_plan/:route_id/save', check_owner_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    var changes = request.body;
    models.NetworkPlan.save_route(route_id, changes, jsonHandler(response, next));
  });

  // Delete an existing route
  api.post('/network_plan/:route_id/delete', check_owner_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    models.NetworkPlan.delete_route(route_id, jsonHandler(response, next));
  });

  // Clear an existing route
  api.post('/network_plan/:route_id/clear', check_owner_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    models.NetworkPlan.clear_route(route_id, jsonHandler(response, next));
  });

  // Clear an existing route
  api.get('/network_plan/:route_id/area_data', check_any_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    models.NetworkPlan.calculate_area_data(route_id, jsonHandler(response, next));
  });

  // Export a route as KML
  api.get('/network_plan/:route_id/:file_name/export', check_any_permission, function(request, response, next) {
    var route_id = request.params.route_id;
    var file_name = request.params.file_name;

    models.NetworkPlan.export_kml(route_id, function(err, kml_output) {
      if (err) return next(err);
      response.attachment(file_name+'.kml');
      response.send(kml_output);
    });
  });

};
