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

export const findMean = array => {
  return array.reduce((a, b) => a + b, 0) / array.length || 0
}

// https://stackoverflow.com/questions/7343890/standard-deviation-javascript
export const findStandardDeviation = array => {
  const len = array.length
  const mean = findMean(array)
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / len)
}
