var helpers = require('../helpers')
var config = helpers.config
var database = helpers.database
var _ = require('underscore')

exports.configure = (api, middleware) => {
  var public_config = _.pick(config,
    'route_planning',
    'ui',
    'currency_symbol',
    'client_carrier_name',
    'displayable_client_carrier_name')
  public_config.ARO_CLIENT = process.env.ARO_CLIENT

  config.client_carrier_name = 'VERIZON' // for demo

  api.get('/', (request, response, next) => {
    var q
    // for cities
    q = `
      SELECT
        cities.city_name || ', ' || cities.country_name AS name,
        cities.city_name || ', ' || cities.country_name AS value
      FROM cities
      ORDER BY city_name ASC
    `
    // for wirecenters
    q = `
      SELECT
        wirecenter || ' - ' || aocn_name as name,
        ST_Y(st_centroid(geom)) || ', ' || ST_X(st_centroid(geom)) as value
      FROM wirecenters
      ORDER BY wirecenter ASC
    `
    database.query(q)
      .then((areas) => {
        response.render('index.html', {
          env: process.env.NODE_ENV,
          env_is_production: process.env.NODE_ENV === 'production',
          env_is_test: process.env.NODE_ENV === 'test',
          user: request.user,
          config: public_config,
          areas: areas
        })
      })
      .catch(next)
  })
}
