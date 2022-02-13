// TODO: possibly use https://github.com/maraisr/diary
const kleur = require('kleur')
const { LOGGER_INCLUDES, LOGGER_FOCUSED } = process.env

let includes = []
try { includes = JSON.parse(LOGGER_INCLUDES) } catch (error) {/* no op */}
if (LOGGER_FOCUSED) {
  console.log()
  console.log(kleur.bgCyan().black('Running logger in focused mode.'))
  if (includes.length) {
    console.log(
      'Running with the following includes:',
      includes.map(include => '`' + include + '`').join(', ') + '.',
    )
  }
  console.log()
}

const prefix = (prefix, message, color) => {
  if (!LOGGER_FOCUSED || includes.includes(prefix)) {
    color = color || 'green'
    prefix = prefix || 'MISSING PREFIX'
    console.log(kleur[color](`${prefix}:`), message)
  }
}

const warn = (message) => {
  console.log(kleur.black().bgYellow('WARNING:'), message)
}

const error = (message) => {
  console.log(kleur.black().bgRed('ERROR:'), message)
}

const createLogger = (prefixText, color) => {
  return message => prefix(prefixText, message, color)
}

module.exports = {
  prefix,
  warn,
  error,
  createLogger,
}
