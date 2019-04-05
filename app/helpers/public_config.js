var _ = require('underscore')
var config = require('./config')

var public_config = _.pick(config,
  'ui',
  'currency_symbol',
  'hsv_defaults',
  'client_carrier_name',
  'length',
  'displayable_client_carrier_name')

module.exports = public_config
