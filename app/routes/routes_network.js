var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/network/fiber_plant/:carrier_name', function(request, response, next) {
    var carrier_name = request.params.carrier_name;
    models.Network.view_fiber_plant_for_carrier(carrier_name, jsonHandler(response, next));
  });

  api.get('/network/carriers', function(request, response, next) {
    models.Network.carrier_names(jsonHandler(response, next));
  });

  // Network nodes for user client by node type
  api.get('/network/nodes/:node_type', function(request, response, next) {
    var node_type = request.params.node_type;
    models.Network.view_network_nodes([node_type], null, jsonHandler(response, next));
  });

  // Network nodes of an existing route
  api.get('/network/nodes/:plan_id/find', check_any_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    var node_types = request.query.node_types ? request.query.node_types.split(',') : null;
    models.Network.view_network_nodes(node_types, plan_id, jsonHandler(response, next));
  });

  // Edit network nodes in a route
  api.post('/network/nodes/:plan_id/edit', check_owner_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    var changes = request.body;
    models.Network.edit_network_nodes(plan_id, changes, jsonHandler(response, next));
  });

  // Clear network nodes in a route
  api.post('/network/nodes/:plan_id/clear', check_owner_permission, function(request, response, next) {
    var plan_id = request.params.plan_id;
    models.Network.clear_network_nodes(plan_id, jsonHandler(response, next));
  });

  // Recalculate network nodes
  api.post('/network/nodes/:plan_id/recalc', check_owner_permission, function(request, response, next) {
    var plan_id = +request.params.plan_id;
    models.Network.recalculate_nodes(plan_id, jsonHandler(response, next));
  });

  // Network node types
  api.get('/network/nodes', function(request, response, next) {
    models.Network.view_network_node_types(jsonHandler(response, next));
  });

};
