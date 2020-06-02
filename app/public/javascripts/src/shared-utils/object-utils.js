// util for merging objects in more interesting ways

class ObjectUtils {
  // deep merge
  //  if default has a prop that obj doesn't: default is used
  //  if obj has a prop that default doesn't: it is NOT used
  //  in this way we can be sure an obj fully complies to a schema
  static maskedMerge (defaultObj, obj) {
    // clone them and remove any functions
    const defaultClone = JSON.parse(JSON.stringify(defaultObj))
    const objString = JSON.stringify(obj)
    // if no obj short circuit this whole thing and return default
    if (objString === undefined
        || objString === 'null'
        || objString === '{}'
        || objString === '[]'
    ) {
      return defaultClone
    }
    const objClone = JSON.parse(objString)
    // if obj isn't iterable send default
    const objPropType = Object.prototype.toString.call(objClone)
    if (objPropType !== '[object Object]' && objPropType !== '[object Array]') {
      return defaultClone
    }
    // be sure the default is iterable
    const defaultObjPropType = Object.prototype.toString.call(defaultClone)
    if (defaultObjPropType !== '[object Object]' && defaultObjPropType !== '[object Array]') {
      return defaultClone
    }
    return this._maskedMergeIteration(defaultClone, objClone)
  }

  static _maskedMergeIteration (defaultObj, obj) {
    var mergedObj = {}
    const objType = Object.prototype.toString.call(defaultObj)
    if (objType === '[object Array]') {
      // note: obj === empty array, is a valid value
      mergedObj = []
      // make sure obj is an array
      if (Object.prototype.toString.call(obj) !== '[object Array]') {
        mergedObj = defaultObj
      } else {
        if (defaultObj.length <= 0) {
          // empty default array, send whatever the new one is
          mergedObj = obj
        } else {
          const elementType = Object.prototype.toString.call(defaultObj[0])
          if (elementType === '[object Object]') {
            // default has defined a schema for elements, compair each obj element to default[0]
            obj.forEach(objEle => {
              mergedObj.push(this._maskedMergeIteration(defaultObj[0], objEle))
            })
          } else {
            // default says these elements aren't objects
            // we may want to implement checking for multidimensional arrays
            mergedObj = obj
          }
        }
      }
    } else if (objType === '[object Object]') {
      Object.keys(defaultObj).forEach((key) => {
        if (!obj.hasOwnProperty(key)) {
          mergedObj[key] = defaultObj[key]
        } else {
          const propType = Object.prototype.toString.call(defaultObj)
          if (propType === '[object Object]' || propType === '[object Array]') {
            mergedObj[key] = this._maskedMergeIteration(defaultObj[key], obj[key])
          } else {
            mergedObj[key] = obj[key]
          }
        }
      })
    } else {
      // all other types, this shouldn't happen
      mergedObj = obj
    }

    return mergedObj
  }
}

export default ObjectUtils
