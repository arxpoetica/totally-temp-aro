var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/county_subdivisions/:statefp', middleware.viewport, function(request, response, next) {
    var statefp = request.params.statefp;
    var viewport = request.viewport;
    models.CountySubdivision.find_by_statefp(statefp, viewport, jsonHandler(response, next));
  });

};
