import { useRef, useEffect } from 'react'
import Constants from './constants.js'
import moment from 'moment'

// ========================= >>>>> style utils

// Function to convert from hsv to rgb color values.
// https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
export const hsvToRgb = (h, s, v) => {
  var r, g, b, i, f, p, q, t
  i = Math.floor(h * 6)
  f = h * 6 - i
  p = v * (1 - s)
  q = v * (1 - f * s)
  t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break
    case 1: r = q, g = v, b = p; break
    case 2: r = p, g = v, b = t; break
    case 3: r = p, g = q, b = v; break
    case 4: r = t, g = p, b = v; break
    case 5: r = v, g = p, b = q; break
  }
  var rgb = [r, g, b]
  var color = '#'
  rgb.forEach((colorValue) => {
    var colorValueHex = Math.round(colorValue * 255).toString(16)
    if (colorValueHex.length === 1) {
      colorValueHex = '0' + colorValueHex
    }
    color += colorValueHex
  })
  return color
}

// We are going to use the golden ratio method from http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
// (Furthermore, it is a property of the golden ratio, Φ, that each subsequent hash value divides the interval into which it falls according to the golden ratio!)
const golden_ratio_conjugate = 0.618033988749895
let hue = Math.random()
export const getRandomColors = () => {
  hue += golden_ratio_conjugate
  hue %= 1
  // We are changing the hue while keeping saturation/value the same. Also the fill colors are lighter than stroke colors.
  return {
    strokeStyle: hsvToRgb(hue, 0.5, 0.5),
    fillStyle: hsvToRgb(hue, 0.8, 0.5)
  }
}

export const selectStyles = {
  placeholder: provided => ({
    ...provided,
    pointerEvents: 'none',
    userSelect: 'none',
  }),
  singleValue: provided => ({
    ...provided,
    pointerEvents: 'none',
    userSelect: 'none',
  }),
  input: provided => ({
    ...provided,
    flex: '1 1 auto',
    '> div': { width: '100%' },
    input: { width: '100% !important', textAlign: 'left' },
  }),
}

// ========================= >>>>> misc utils

// logout function
export const logoutApp = () => {
  window.location.href = '/logout'
  localStorage.removeItem(Constants.BROADCAST_LOCAL_STORAGE)
}

export const flattenDeep = (arr) => {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
}

// ========================= >>>>> date utils

// date transormations
// see: https://stackoverflow.com/a/38050824/209803
// and: https://zachholman.com/talk/utc-is-enough-for-everyone-right
export const toIsoStartDate = isoDayString => new Date(`${isoDayString}T00:00:00.000`)
export const toIsoEndDate = isoDayString => new Date(`${isoDayString}T23:59:59.000`)
export const toUTCDate = date => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
))

// utilize moment for time handling
export const momentStartDate = startDate => moment(`${startDate}T00:00:00.000`)
export const momentEndDate = endDate => moment(`${endDate}T23:59:59.000`)

// These two are for formatting for datetime-local and date input elements
export const getDateString = (date) => date.toISOString().substring(0, 10)
export const getDateTimeString = (date) => date.toISOString().substring(0, 16)

// ========================= >>>>> react hooks

// see: https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
export const usePrevious = value => {
  const ref = useRef()
  useEffect(() => { ref.current = value })
  return ref.current
}

// https://codereview.stackexchange.com/questions/66733/groupby-implementation-in-nodejs/66752#66752
export const groupBy = (array, keyOrIterator) => {
  let iterator, key

  // use the function passed in, or create one
  if(typeof key !== 'function') {
    key = String(keyOrIterator)
    iterator = function (item) { return item[key] }
  } else {
    iterator = keyOrIterator
  }

  return array.reduce(function (memo, item) {
    const key = iterator(item)
    memo[key] = memo[key] || []
    memo[key].push(item)
    return memo
  }, {})
}

// https://newbedev.com/converting-lodash-uniqby-to-native-javascript
export const uniqBy = (arr, predicate) => {
  const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate]
  
  return [...arr.reduce((map, item) => {
    const key = (item === null || item === undefined) ? 
      item : cb(item)
    
    map.has(key) || map.set(key, item)
    
    return map
  }, new Map()).values()]
}

// To compare two array and find the difference value
// https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
export const arrayComparer = (otherArray) => {
  return function(current) {
    return otherArray.filter(function(other) {
      return other.value === current.value
    }).length === 0
  }
}

// TODO: Make query system more robust 183115918
export const setAppcuesQuery = (queryParam) => {
  const url = new URL(window.location);
  url.searchParams.set('appcues', queryParam);
  window.history.pushState(null, '', url.toString());
  window.Appcues.page()
}