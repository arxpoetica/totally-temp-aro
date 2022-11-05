import _ from 'underscore'
import config from './config.cjs'

var public_config = _.pick(config,
  'ui',
  'currency_symbol',
  'hsv_defaults',
  'length',
  'currency_code',
  'intl_number_format')

export default public_config
