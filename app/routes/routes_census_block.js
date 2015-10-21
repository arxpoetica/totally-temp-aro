var models = require('../models');

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;

  api.get('/census_blocks/:statefp/:countyfp', middleware.viewport, function(request, response, next) {
    var statefp = request.params.statefp;
    var countyfp = request.params.countyfp;
    var viewport = request.viewport;
    models.CensusBlock.find_by_statefp_and_countyfp(statefp, countyfp, viewport, jsonHandler(response, next));
  });

};
