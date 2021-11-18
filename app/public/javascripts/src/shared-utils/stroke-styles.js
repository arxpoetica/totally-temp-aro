
function parseColor(input) {
  // takes strings like 
  // #FF9900
  // #f90
  // rgb(255, 153, 0)
  // and returns an array of numbers 
  // [255, 153, 0]
  if (input.substr(0,1) === '#') {
    var cols = (input.length-1)/3
    var vals = [
      input.substr(1,cols),
      input.substr(1+cols,cols),
      input.substr(1+2*cols,cols),
    ]
    if (cols === 1) vals = vals.map(val => val+''+val)
    vals = vals.map( val => Number(`0x${val}`) )
    return vals
  }
  
  return input.split("(")[1].split(")")[0].split(",").map(x=>+x)
}

function findNegativeColor (oStrokeStyle) {
  var negativeColor = '#ffffff'
  if ('string' === typeof oStrokeStyle) {
    let color = parseColor(oStrokeStyle)
    // quick and dirty saturation / lightness conversion, enough for our purposes 
    // average and second derivation 
    // derv2 0 => 340
    let avg = color.reduce((ttl, val) => ttl + val, 0) / color.length
    let derv2 = color.reduce((ttl, val) => ttl + Math.abs(val-avg), 0)
    // if saturation is under 50% and lightness is grerater than 75%, use a black line instead of a white one
    if (derv2 <= 170 && avg >= 185) negativeColor = '#000000'
  }
  return negativeColor
}


function defaultStroke (ctx) {
  // no change to the line style
  ctx.stroke()
}

function aerialStroke (ctx) {
  var oLineCap = ctx.lineCap
  var oLineWidth = ctx.lineWidth
  var oStrokeStyle = ctx.strokeStyle
  ctx.lineCap = 'butt'

  var negativeColor = findNegativeColor(oStrokeStyle)

  ctx.lineWidth = 1.5 * oLineWidth
  ctx.stroke()
  ctx.lineWidth = 0.5 * oLineWidth
  ctx.strokeStyle = negativeColor
  ctx.stroke()
  // restore
  ctx.strokeStyle = oStrokeStyle
  ctx.lineWidth = oLineWidth
  ctx.lineCap = oLineCap
}

function buriedStroke (ctx) {
  var oLineCap = ctx.lineCap
  var oLineDash = ctx.getLineDash()
  ctx.lineCap = 'butt'

  ctx.setLineDash([6, 2])
  ctx.stroke()
  // restore
  ctx.setLineDash(oLineDash)
  ctx.lineCap = oLineCap
}

function undergroundStroke (ctx) {
  var oLineCap = ctx.lineCap
  var oLineDash = ctx.getLineDash()
  ctx.lineCap = 'butt'

  ctx.setLineDash([10, 2, 2, 2])
  ctx.stroke()
  // restore
  ctx.setLineDash(oLineDash)
  ctx.lineCap = oLineCap
}

function obstacleStroke (ctx) {
  var oLineCap = ctx.lineCap
  var oLineWidth = ctx.lineWidth
  var oLineDash = ctx.getLineDash()
  var oStrokeStyle = ctx.strokeStyle
  ctx.lineCap = 'butt'

  var negativeColor = findNegativeColor(oStrokeStyle)

  ctx.lineWidth = 1.5 * oLineWidth
  ctx.setLineDash([2,2]) //3,2
  ctx.stroke()

  ctx.lineWidth = 0.5 * oLineWidth
  ctx.setLineDash([])
  ctx.stroke()

  ctx.strokeStyle = negativeColor
  ctx.setLineDash([1,4,3,0]) // 2,4,4,0
  ctx.stroke()
  // restore
  ctx.strokeStyle = oStrokeStyle
  ctx.lineWidth = oLineWidth
  ctx.setLineDash(oLineDash)
  ctx.lineCap = oLineCap
}

var StrokeStyle = {
  'DEFAULT_LINE': {
    'previewImg': null,
    'styledStroke': defaultStroke
  },
  'AERIAL_LINE': {
    'previewImg': null,
    'styledStroke': aerialStroke
  },
  'BURIED_LINE': {
    'previewImg': null,
    'styledStroke': buriedStroke
  },
  'UNDERGROUND_LINE': {
    'previewImg': null,
    'styledStroke': undergroundStroke
  },
  'OBSTACLE_LINE': {
    'previewImg': null,
    'styledStroke': obstacleStroke
  },
}

function generatePreviewImgs () {
  var w = 16 // NOTE: w should be divisible by any/all setLineDash array totals
  var h = 8
  var y = 4.5
  var cnv0 = document.createElement('canvas')
  var ctx0 = cnv0.getContext("2d")
  cnv0.width = w
  cnv0.height = h
  ctx0.strokeStyle = '#333333'
  ctx0.lineWidth = 2
  ctx0.save()
  Object.values(StrokeStyle).forEach(style => {
    ctx0.restore()
    ctx0.clearRect(0, 0, w, h)
    ctx0.moveTo(0, y)
    ctx0.lineTo(w, y)
    style.styledStroke(ctx0)
    style.previewImg = cnv0.toDataURL("image/png")
  })
}

generatePreviewImgs()

Object.freeze(StrokeStyle)

export default StrokeStyle
