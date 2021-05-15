import { useRef, useEffect } from 'react'

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
}

export const flattenDeep = (arr) => {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
}

// ========================= >>>>> date utils

// date transormations
// see: https://stackoverflow.com/a/38050824/209803
// and: https://zachholman.com/talk/utc-is-enough-for-everyone-right
export const toDateFromIsoDay = isoDayString => new Date(`${isoDayString}T00:00:00.000`)
export const toUTCDate = date => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
))

// ========================= >>>>> react hooks

// see: https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
export const usePrevious = value => {
  const ref = useRef()
  useEffect(() => { ref.current = value })
  return ref.current
}
