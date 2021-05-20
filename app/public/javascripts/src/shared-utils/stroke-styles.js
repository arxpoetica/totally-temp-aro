
function aerialStroke(ctx, isHighlight){
  var oLineWidth = ctx.lineWidth
  var oStrokeStyle = ctx.strokeStyle
  if (isHighlight) {
    ctx.lineWidth = 6
  } else {
    ctx.lineWidth = 3
  }
  ctx.stroke()
  if (isHighlight) {
    ctx.lineWidth = 2
  } else {
    ctx.lineWidth = 1
  }
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  // restore
  ctx.lineWidth = oLineWidth
  ctx.strokeStyle = oStrokeStyle
}

function buriedStroke(ctx, isHighlight){
  var oLineDash = ctx.getLineDash()
  ctx.setLineDash([5, 3])
  ctx.stroke()
  // restore
  ctx.setLineDash(oLineDash)
}

var StrokeStyle = {
  'AERIAL_LINE': {
    'previewImg': null,
    'styledStroke': aerialStroke
  },
  'BURIED_LINE': {
    'previewImg': null,
    'styledStroke': buriedStroke
  },
}

function generatePreviewImgs(){
  console.log('render preview images')
  var w = 16
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
    style.styledStroke(ctx0, false)
    style.previewImg = cnv0.toDataURL("image/png")
    //style.previewImg = cnv0.toDataURL("image/png").replace("image/png", "image/octet-stream")
  })
}

generatePreviewImgs()

Object.freeze(StrokeStyle)

export default StrokeStyle
