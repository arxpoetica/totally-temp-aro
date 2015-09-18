var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/county_subdivisions/:statefp', function(request, response, next) {
    var statefp = request.params.statefp;
    models.CountySubdivision.find_by_statefp(statefp, jsonHandler(response, next));
  });

};
