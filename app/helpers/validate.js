import _ from 'underscore'

function expect (obj, path, type) {
  var comps = []
  var attrs = path.split('.')
  attrs.forEach((comp) => {
    var attr = comps.length === 0 ? obj : obj[comp]
    comps.push(comp)
    if (comps.length === attrs.length) {
      var func = 'is' + type.substring(0, 1).toUpperCase() + type.substring(1)
      if (!_[func](attr) || (type === 'number' && _.isNaN(attr))) {
        throw new Error(`Expected ${comps.join('.')} to be of type ${type}. It is of type ${typeof attr} and is = ${attr}`)
      }
    } else {
      if (!_.isObject(attr)) {
        throw new Error(`Expected ${comps.join('.')} to be an object. It is of type ${typeof attr} and is = ${attr}`)
      }
    }
    obj = attr
  })
}

export default function (validations) {
  return new Promise((resolve, reject) => {
    validations(expect)
    resolve()
  })
}
