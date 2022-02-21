// FIXME: to speed up logging, could use `new Set` and `.has()` for logix

const kleur = require('kleur')
const { LOGGER_STATE, LOGGER_FOCUSES } = process.env

// maintained list of possible log states
const LOGGER_STATES = Object.freeze({
  FOCUSED: 'focused',
  // TODO: finish out various states...
  SILENT: 'silent',
  // INFO: 'info',
  // WARNINGS: 'warnings',
  // ERRORS: 'errors',
  VERBOSE: 'verbose', // default, shows everything
})
// maintained list of possible log system groups
const LOGGER_GROUPS = Object.freeze({
  RABBIT_MQ: { group: 'RABBIT-MQ', color: 'cyan' },
  SOCKET: { group: 'SOCKET', color: 'yellow' },
  CACHE: { group: 'CACHE', color: 'gray' },
  CONFIG: { group: 'CONFIG', color: 'gray' },
  EMAIL: { group: 'EMAIL', color: 'gray' },
  ARO_SERVICE: { group: 'ARO-SERVICE', color: 'cyan' },
  MODELS: { group: 'MODELS', color: 'blue' },
  ROUTES: { group: 'ROUTES', color: 'magenta' },
})

const loggerState = LOGGER_STATE || LOGGER_STATES.VERBOSE

let focuses = []
try { focuses = JSON.parse(LOGGER_FOCUSES) } catch (error) {/* no op */}

console.log()
console.log(kleur.bgCyan().black(` Running logger in "${loggerState}" mode `))
if (focuses.length) {
  console.log(
    'Running logger with the following focuses:',
    focuses.map(focus => `"${focus}"`).join(', ') + '.',
  )
}
console.log()

class Logger {
  constructor(group, color) {
    this.group = group || 'NO GROUP'
    this.prefix = kleur[color || 'green'](`[${this.group}]`)
  }

  // TODO: make this a private member `#log` when babel upgrade happens
  _log(type, message, detail) {
    if (loggerState !== LOGGER_STATES.SILENT) {
      const fullPrefix = this.prefix ? `${this.prefix} ${type}` : type
      if (loggerState !== LOGGER_STATES.FOCUSED || focuses.includes(this.group)) {
        console.log(fullPrefix, message)
        if (detail && loggerState === LOGGER_STATES.VERBOSE) {
          // TODO: could expand on HOW this is displayed???
          console.log(detail)
        }
      }
    }
  }

  info(message, detail) { this._log(kleur.green('[INFO]'), message, detail) }
  status(message, detail) { this._log(kleur.yellow('[STATUS]'), message, detail) }
  warn(message, detail) { this._log(kleur.black().bgYellow('[WARNING]'), message, detail) }
  error(message, detail) { this._log(kleur.black().bgRed('[ERROR]'), message, detail) }
}

function createLogger({ group, color }) {
  return new Logger(group, color)
}

module.exports = {
  LOGGER_STATES,
  LOGGER_GROUPS,
  createLogger,
}
