
function defaultStroke (ctx) {
  // no change to the line style
  ctx.stroke()
}

function aerialStroke (ctx) {
  var oLineCap = ctx.lineCap
  var oLineWidth = ctx.lineWidth
  var oStrokeStyle = ctx.strokeStyle
  ctx.lineCap = 'butt'

  ctx.lineWidth = 1.5 * oLineWidth
  ctx.stroke()
  ctx.lineWidth = 0.5 * oLineWidth
  ctx.strokeStyle = '#ffffff'
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
