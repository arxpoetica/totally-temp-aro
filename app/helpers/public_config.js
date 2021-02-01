var _ = require('underscore')
var config = require('./config')

var public_config = _.pick(config,
  'ui',
  'currency_symbol',
  'hsv_defaults',
  'length',
  'currency_code',
  'intl_number_format')

module.exports = public_config
