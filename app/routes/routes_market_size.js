var models = require('../models');
var _ = require('underscore');
var nook = require('node-errors').nook;
var fs = require('fs')
var path = require('path')
var temp = require('temp')

exports.configure = function(api, middleware) {

  var check_any_permission = middleware.check_any_permission;
  var check_owner_permission = middleware.check_owner_permission;
  var jsonHandler = middleware.jsonHandler;
  var cacheable = middleware.cacheable;

  var export_dir = temp.mkdirSync('aro_export');

  function timer(interval, tick, end) {
    var time = Date.now();
    function seconds() {
      return Math.floor((Date.now()-time)/1000);
    }
    var timer = setInterval(function() {
      tick(seconds());
    }, interval*1000);
    return {
      stop: function() {
        clearInterval(timer);
        end(seconds());
      }
    }
  }

  function export_handler(request, response, next) {
    var filename = request.query.filename;
    var userid = request.user.id;
    var time = Date.now()
    var t = timer(5,
      (seconds) => {
        console.log('Generating CSV', filename, seconds, 'seconds')
        response.write(seconds+'.')
      },
      (seconds) => console.log('Finished exporting CSV', filename, seconds, 'seconds')
    )
    return function(err, output) {
      t.stop();
      if (err) return next(err);
      var fullname = path.join(export_dir, userid+'_'+filename);
      fs.writeFile(fullname, output, 'utf8', function(err) {
        if (err) return next(err);
        response.write('Done');
        response.end();
      });
    }
  }

  api.get('/exported_file', function(request, response, next) {
    var filename = request.query.filename;
    var userid = request.user.id;
    var fullname = path.join(export_dir, userid+'_'+filename);
    fs.readFile(fullname, 'utf8', function(err, output) {
      if (err) return next(err);
      response.attachment(filename+'.csv');
      response.send(output);
    })
  })

  // Market size filters
  api.get('/market_size/filters', function(request, response, next) {
    models.MarketSize.filters(jsonHandler(response, next));
  });

  // Market size calculation
  api.get('/market_size/plan/:plan_id/calculate', cacheable, function(request, response, next) {
    var plan_id = +request.params.plan_id;
    var type = request.query.type;
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type,
      },
    };
    models.MarketSize.calculate(plan_id, type, options, jsonHandler(response, next));
  });

  // Export businesses involved in market size calculation
  api.get('/market_size/plan/:plan_id/export', function(request, response, next) {
    var plan_id = +request.params.plan_id;
    var type = request.query.type;
    var options = {
      boundary: request.query.boundary,
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type,
      },
    };
    models.MarketSize.export_businesses(plan_id, type, options, request.user, export_handler(request, response, next));
  });

  api.get('/market_size/business/:business_id', function(request, response, next) {
    var business_id = +request.params.business_id;
    var options = {
      filters: {
        product: arr(request.query.product),
      },
    };
    models.MarketSize.market_size_for_business(business_id, options, jsonHandler(response, next));
  });

  api.get('/market_size/location/:location_id', function(request, response, next) {
    var location_id = +request.params.location_id;
    var filters = {
      industry: arr(request.query.industry),
      employees_range: arr(request.query.employees_range),
      product: arr(request.query.product),
      customer_type: request.query.customer_type,
    };
    models.MarketSize.market_size_for_location(location_id, filters, jsonHandler(response, next));
  });

  api.get('/market_size/plan/:plan_id/location/:location_id/export', function(request, response, next) {
    var plan_id = +request.params.plan_id;
    var location_id = +request.params.location_id;
    var type = request.query.type;
    var options = {
      filters: {
        industry: arr(request.query.industry),
        employees_range: arr(request.query.employees_range),
        product: arr(request.query.product),
        customer_type: request.query.customer_type,
      },
    };
    models.MarketSize.export_businesses_at_location(plan_id, location_id, type, options, request.user, export_handler(request, response, next));
  });

  function arr(value) {
    return _.compact((value || '').split(','));
  };

};
