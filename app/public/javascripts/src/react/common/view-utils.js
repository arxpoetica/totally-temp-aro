import Constants from './constants.js'

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
// Logout function
export const logoutApp = () => {
  window.location.href = '/logout'
  removeLocalStorage(Constants.BROADCAST_LOCAL_STORAGE)
}

export const flattenDeep = (arr) => {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
}

// date transormations
// see: https://stackoverflow.com/a/38050824/209803
// and: https://zachholman.com/talk/utc-is-enough-for-everyone-right
export const toDateFromIsoDay = isoDayString => new Date(`${isoDayString}T00:00:00.000`)
export const toUTCDate = date => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
))

export const formatDate = date => {
  const year = date.getFullYear()
  const month = ("0" + (date.getMonth() + 1)).slice(-2)
  const day = ("0" + date.getDate()).slice(-2)
  const formatDate = year + "-" + month + "-" + day
  return formatDate
}

export function setBroadcastExpiry (key, value) {
  const now = new Date()
  const broadcastObj = {
    value,
    expiry: now.getTime() + Constants.BROADCAST_EXPIRY_TIME
  }
  // set the value and expiryTime in localStorage
  localStorage.setItem(key, JSON.stringify(broadcastObj))
}

export function checkBroadcastExpiry (key) {
  // get the item 'showBroadcast' from localStorage
  const broadcastExpiry = localStorage.getItem(key)
  if (!broadcastExpiry) return true
  let broadcastObj = null
  try {
    broadcastObj = JSON.parse(broadcastExpiry)
    const now = new Date()
    // compares the expiry time with the current time
    if (now.getTime() > broadcastObj.expiry) {
    // if the time is expired, remove it from localStorage
      removeLocalStorage(key)
      return true
    }
  } catch {
    removeLocalStorage(key)
    return true
  }
  return broadcastObj.value
}

export function removeLocalStorage (key) {
  // removes the required key from localStorage
  localStorage.removeItem(key)
}
