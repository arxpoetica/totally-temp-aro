class PolylineFeatureRenderer {
  // Renders a polyline feature onto the canvas
  static renderFeature (feature, shape, geometryOffset, ctx, mapLayer, drawingStyleOverrides, isPolygonBorder, tileSize) {
    const oldOpacity = ctx.globalAlpha
    if (drawingStyleOverrides && drawingStyleOverrides.lineOpacity) {
      ctx.globalAlpha = drawingStyleOverrides.lineOpacity
    }

    if (drawingStyleOverrides && drawingStyleOverrides.strokeStyle) {
      ctx.strokeStyle = drawingStyleOverrides.strokeStyle
    } else {
      // TODO: there's an inconsistent schema somewhere in the code.
      // This hotfix is normalizing for it, but `drawingOptions`
      // really should be normalized at the source.
      const strokeStyle = mapLayer.drawingOptions
        ? mapLayer.drawingOptions.strokeStyle
        : mapLayer.strokeStyle
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle
      }
    }
    // ctx.strokeStyle = drawingStyleOverrides ? drawingStyleOverrides.strokeStyle : mapLayer.drawingOptions.strokeStyle
    
    let lineWidth = null
    if (drawingStyleOverrides && drawingStyleOverrides.lineWidth) {
      lineWidth = drawingStyleOverrides.lineWidth
    } else {
      // TODO: there's an inconsistent schema somewhere in the code.
      // This hotfix is normalizing for it, but `drawingOptions`
      // really should be normalized at the source.
      const lineWidthValue = mapLayer.drawingOptions
        ? mapLayer.drawingOptions.lineWidth
        : mapLayer.lineWidth
      if (typeof lineWidthValue === 'function') {
        lineWidth = lineWidthValue(feature)
      } else {
        lineWidth = lineWidthValue
      }
    }
    ctx.lineWidth = lineWidth || 1


    var xPrev = shape[0].x + geometryOffset.x
    var yPrev = shape[0].y + geometryOffset.y
    ctx.beginPath()
    ctx.moveTo(xPrev, yPrev)
    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
      var xNext = shape[iCoord].x + geometryOffset.x
      var yNext = shape[iCoord].y + geometryOffset.y
      var shouldRenderLine = true
      // ONLY for polygon borders, skip rendering the line segment if it is along the tile extents.
      // Without this, polygons that are clipped (like 5G boundaries) will have internal lines.
      if (isPolygonBorder) {
        var isAlongXMin = (xPrev === 0 && xNext === 0)
        var isAlongXMax = (xPrev === tileSize.width && xNext === tileSize.width)
        var isAlongYMin = (yPrev === 0 && yNext === 0)
        var isAlongYMax = (yPrev === tileSize.height && yNext === tileSize.height)
        shouldRenderLine = !isAlongXMin && !isAlongXMax && !isAlongYMin && !isAlongYMax
      }
      if (shouldRenderLine) {
        // Segment is not along the tile extents. Draw it. We do this because polygons can be
        // clipped by the tile extents, and we don't want to draw segments along tile extents.
        ctx.lineTo(xNext, yNext)
      }
      xPrev = xNext
      yPrev = yNext
      ctx.moveTo(xPrev, yPrev)
    }
    if (drawingStyleOverrides.hasOwnProperty('styledStroke')) {
      drawingStyleOverrides.styledStroke(ctx)
    } else {
      ctx.stroke()
    }

    // Draw the polyline direction if the map options specify it
    if (mapLayer.showPolylineDirection) {
      this.drawPolylineDirection(shape, geometryOffset, ctx, ctx.strokeStyle)
    }

    ctx.globalAlpha = oldOpacity
  }
  // Draws an arrow showing the direction of a polyline
  static drawPolylineDirection (shape, geometryOffset, ctx, strokeStyle) {
    if (shape.length <= 1) {
      return // Nothing to do
    }

    // Find the length of the polyline
    var polylineLength = 0.0
    var segmentLengths = []
    for (var iCoord = 0; iCoord < shape.length - 1; ++iCoord) {
      const deltaX = shape[iCoord + 1].x - shape[iCoord].x + geometryOffset.x
      const deltaY = shape[iCoord + 1].y - shape[iCoord].y + geometryOffset.y
      const segmentLength = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY))
      segmentLengths.push(segmentLength)
      polylineLength += segmentLength
    }

    const arrowLength = 5; const arrowWidth = 5
    if (polylineLength < arrowLength * 2.0) {
      // Polyline is too small at this zoom level. Do not draw an arrow
      return
    }

    // Now travel along the polyline and find the point that is in the middle
    var xCenter = NaN; var yCenter = NaN
    var currentSegment = 0; var centerSegment = -1
    var remainingDistance = polylineLength / 2
    while (remainingDistance > 0 && currentSegment < segmentLengths.length) {
      if (segmentLengths[currentSegment] < remainingDistance) {
        remainingDistance -= segmentLengths[currentSegment]
        ++currentSegment
        continue
      }
      // The center point lies on this segment
      const fraction = remainingDistance / segmentLengths[currentSegment]
      const deltaX = shape[currentSegment + 1].x - shape[currentSegment].x + geometryOffset.x
      const deltaY = shape[currentSegment + 1].y - shape[currentSegment].y + geometryOffset.y
      xCenter = shape[currentSegment].x + fraction * deltaX + geometryOffset.x
      yCenter = shape[currentSegment].y + fraction * deltaY + geometryOffset.y
      centerSegment = currentSegment
      ++currentSegment
      break
    }

    // Get the unit direction for the segment on which the center point lies
    const unitDirection = {
      x: (shape[centerSegment + 1].x - shape[centerSegment].x) / segmentLengths[centerSegment],
      y: (shape[centerSegment + 1].y - shape[centerSegment].y) / segmentLengths[centerSegment]
    }
    // Get the direction perpendicular to this unit direction
    const unitPerpendicularDirection = {
      x: -unitDirection.y,
      y: unitDirection.x
    }

    ctx.strokeStyle = strokeStyle
    ctx.beginPath()
    // Define the 3 points for the arrow. One at the tip, the other two at the bottom
    const pt1 = {
      x: xCenter + (unitDirection.x * arrowLength / 2),
      y: yCenter + (unitDirection.y * arrowLength / 2)
    }
    const pt2 = {
      x: xCenter - (unitDirection.x * arrowLength / 2) + (unitPerpendicularDirection.x * arrowWidth / 2),
      y: yCenter - (unitDirection.y * arrowLength / 2) + (unitPerpendicularDirection.y * arrowWidth / 2)
    }
    const pt3 = {
      x: xCenter - (unitDirection.x * arrowLength / 2) - (unitPerpendicularDirection.x * arrowWidth / 2),
      y: yCenter - (unitDirection.y * arrowLength / 2) - (unitPerpendicularDirection.y * arrowWidth / 2)
    }
    ctx.moveTo(pt1.x, pt1.y)
    ctx.lineTo(pt2.x, pt2.y)
    ctx.lineTo(pt3.x, pt3.y)
    ctx.lineTo(pt1.x, pt1.y)
    ctx.stroke()
  }
}

export default PolylineFeatureRenderer
