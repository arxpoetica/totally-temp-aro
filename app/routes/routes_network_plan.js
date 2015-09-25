var models = require('../models');
var nook = require('node-errors').nook;

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
    models.NetworkPlan.create_plan(name, area, request.user, jsonHandler(response, next));
  });

  // Return data of an existing plan
  api.get('/network_plan/:plan_id', check_any_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    models.NetworkPlan.find_plan(plan_id, jsonHandler(response, next));
  });

  // Return the metadata of an existing plan
  api.get('/network_plan/:plan_id/metadata', check_any_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    models.NetworkPlan.find_plan(plan_id, true, jsonHandler(response, next));
  });

  // Edits the route of an existing network plan
  api.post('/network_plan/:plan_id/edit', check_owner_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    var changes = request.body;
    models.NetworkPlan.edit_route(plan_id, changes, jsonHandler(response, next));
  });

  // Edits basic information of an existing plan
  api.post('/network_plan/:plan_id/save', check_owner_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    var changes = request.body;
    models.NetworkPlan.save_plan(plan_id, changes, jsonHandler(response, next));
  });

  // Delete an existing plan
  api.post('/network_plan/:plan_id/delete', check_owner_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    models.NetworkPlan.delete_plan(plan_id, jsonHandler(response, next));
  });

  // Clear the route of an existing plan
  api.post('/network_plan/:plan_id/clear', check_owner_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    models.NetworkPlan.clear_route(plan_id, jsonHandler(response, next));
  });

  // Get some area information of a given plan
  api.get('/network_plan/:plan_id/area_data', check_any_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    models.NetworkPlan.calculate_area_data(plan_id, jsonHandler(response, next));
  });

  // Export a route as KML
  api.get('/network_plan/:plan_id/:file_name/export', check_any_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    var file_name = request.params.file_name;

    models.NetworkPlan.export_kml(plan_id, nook(next, function(kml_output) {
      response.attachment(file_name+'.kml');
      response.send(kml_output);
    }));
  });

};
