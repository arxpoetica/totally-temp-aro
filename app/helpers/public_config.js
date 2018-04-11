var _ = require('underscore')
var config = require('./config')

var public_config = _.pick(config,
  'route_planning',
  'ui',
  'currency_symbol',
  'hsv_defaults',
  'client_carrier_name',
  'length',
  'displayable_client_carrier_name')
public_config.ARO_CLIENT = process.env.ARO_CLIENT

module.exports = public_config
