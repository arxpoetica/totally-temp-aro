import PolylineFeatureRenderer from './polyline-feature-renderer'

class PolygonFeatureRenderer {
  // First renders unselected polygon's then selected polygons
  // So selected polygon styles will be visible
  static renderFeatures (closedPolygonFeatureLayersList, featureData, selection, oldSelection) {
    var unselectedClosedPolygonFeatureLayersList = closedPolygonFeatureLayersList.filter((featureObj) => {
      if (featureObj.selectedDisplayMode == featureObj.displayModes.VIEW && featureObj.feature.properties.id != oldSelection.details.serviceAreaId) {
        return featureObj
      } else if (featureObj.selectedDisplayMode == featureObj.displayModes.ANALYSIS && !selection.planTargets.serviceAreas.has(featureObj.feature.properties.id)) {
        return featureObj
      } else {
        return featureObj
      }
    })

    var selectedClosedPolygonFeatureLayersList = closedPolygonFeatureLayersList.filter((featureObj) => {
      if (featureObj.selectedDisplayMode == featureObj.displayModes.VIEW && featureObj.feature.properties.id == oldSelection.details.serviceAreaId) {
        return featureObj
      } else if (featureObj.selectedDisplayMode == featureObj.displayModes.ANALYSIS && selection.planTargets.serviceAreas.has(featureObj.feature.properties.id)) {
        return featureObj
      }
    })

    unselectedClosedPolygonFeatureLayersList.forEach((Obj) => {
      PolygonFeatureRenderer.renderFeature(Obj.feature, featureData, Obj.shape, Obj.geometryOffset, Obj.ctx, Obj.mapLayer, Obj.layerCategories, Obj.tileDataService, Obj.styles,
        Obj.tileSize, selection, oldSelection, Obj.selectedDisplayMode, Obj.displayModes,
        Obj.analysisSelectionMode, Obj.selectionModes)
    })

    selectedClosedPolygonFeatureLayersList.forEach((Obj) => {
      PolygonFeatureRenderer.renderFeature(Obj.feature, featureData, Obj.shape, Obj.geometryOffset, Obj.ctx, Obj.mapLayer, Obj.layerCategories, Obj.tileDataService, Obj.styles,
        Obj.tileSize, selection, oldSelection, Obj.selectedDisplayMode, Obj.displayModes,
        Obj.analysisSelectionMode, Obj.selectionModes)
    })
  }

  // Renders a polygon feature onto the canvas
  static renderFeature (feature, featureData, shape, geometryOffset, ctx, mapLayer, layerCategories, tileDataService, styles, tileSize,
    selection, oldSelection, selectedDisplayMode, displayModes, analysisSelectionMode, selectionModes) {
    ctx.lineCap = 'round'
    // Get the drawing styles for rendering the polygon
    var drawingStyles = this.getDrawingStylesForPolygon(feature, mapLayer)

    if (drawingStyles) {
      // TODO: should this go into getDrawingStylesForPolygon?
      // TODO: use an object merge of mapLayer.highlightStyle instead having to know which attributes are implemented
      // TODO: need to ensure feature type
      //    a non-selected service area could have the same id as the selected census block
      if (feature.properties.hasOwnProperty('layerType') && feature.properties.layerType == 'census_block') {
        if (oldSelection.details.censusBlockId == feature.properties.id) {
          // Hilight selected census block
          drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
          drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
        }
      } else if (
        selection.planTargets.serviceAreas.has(feature.properties.id)
        && selectedDisplayMode == displayModes.ANALYSIS
        && analysisSelectionMode == selectionModes.SELECTED_AREAS
      ) {
        // Highlight the selected SA
        // highlight if analysis mode -> selection type is service areas
        drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
        drawingStyles.fillStyle = mapLayer.highlightStyle.fillStyle
        drawingStyles.opacity = mapLayer.highlightStyle.opacity
        drawingStyles.lineOpacity = mapLayer.highlightStyle.lineOpacity
      } else if (
        selection.planTargets.analysisAreas.has(feature.properties.id)
        && selectedDisplayMode == displayModes.ANALYSIS
      ) {
        // highlight if analysis mode -> selection type is service areas
        drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
        drawingStyles.fillStyle = mapLayer.highlightStyle.fillStyle
        drawingStyles.opacity = mapLayer.highlightStyle.opacity
        drawingStyles.lineOpacity = mapLayer.highlightStyle.lineOpacity
      } else if (
        oldSelection.details.serviceAreaId
        && (oldSelection.details.serviceAreaId == feature.properties.id)
        && selectedDisplayMode == displayModes.VIEW
      ) {
        // Highlight the selected SA in view mode
        drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
        drawingStyles.lineOpacity = mapLayer.highlightStyle.lineOpacity
      } else if (
        feature.properties.hasOwnProperty('_data_type')
        && feature.properties._data_type === 'analysis_area'
        && oldSelection.details.analysisAreaId == feature.properties.id
        && selectedDisplayMode == displayModes.VIEW
      ) {
        // Highlight the selected SA in view mode
        drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
        drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
      } else if (
        oldSelection.details.siteBoundaryId
        && (oldSelection.details.siteBoundaryId == feature.properties.object_id)
        && feature.properties.hasOwnProperty('_data_type')
        && selectedDisplayMode == displayModes.EDIT_PLAN
      ) {
        // Highlight the selected siteBoundary in Edit mode on selection
        drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
      } else if (
        (feature.properties._data_type)
        && feature.properties._data_type === 'equipment_boundary.select'
        && feature.properties.workflow_state_id === 2
      ) {
        drawingStyles.strokeStyle = '#0101F6'
        drawingStyles.fillStyle = mapLayer.highlightStyle.fillStyle
        drawingStyles.lineOpacity = styles.modifiedBoundary.lineOpacity
      }

      // FIXME: this is horrible but necessary conversion.
      // Somewhere up the line we have inconsistent `feature.properties.tags` data
      // sometimes sending as an object `{ "1": 2 }` and sometimes as a string `1:1`
      // this conversion is only temporary to deal w/ that inconsistency. 👿
      let { tags } = feature.properties
      if (tags && tags.length) {
        const parts = tags.split(':')
        tags = {}
        tags[parts[0]] = parts[1]
      }

      const { categorySelections = [] } = oldSelection.details
      for (const { layerCategoryId, analysisLayerId } of categorySelections) {
        if (
          typeof layerCategoryId === 'number'
          && tags && tags.hasOwnProperty(layerCategoryId)
          && feature.properties.layerId === analysisLayerId
        ) {
          let tagId = tags[layerCategoryId]
          if (layerCategories[layerCategoryId].tags.hasOwnProperty(tagId)) {
            let color = layerCategories[layerCategoryId].tags[tagId].colourHash
            drawingStyles.strokeStyle = color
            drawingStyles.fillStyle = color
          }
        }
      }

      if (
        tileDataService.modifiedBoundaries.hasOwnProperty(feature.properties.object_id)
        && mapLayer.tileDefinitions[0].vtlType == 'ExistingBoundaryPointLayer'
      ) {
        drawingStyles.strokeStyle = styles.modifiedBoundary.strokeStyle
        drawingStyles.lineOpacity = styles.modifiedBoundary.lineOpacity
      }

      ctx.fillStyle = drawingStyles.fillStyle
      ctx.globalAlpha = drawingStyles.opacity
    }

    // Draw a filled polygon with the drawing styles computed for this feature
    var x0 = geometryOffset.x + shape[0].x
    var y0 = geometryOffset.y + shape[0].y
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
      var x1 = geometryOffset.x + shape[iCoord].x
      var y1 = geometryOffset.y + shape[iCoord].y
      ctx.lineTo(x1, y1)
    }
    ctx.fill()

    // Make Line Border is highlighted
    ctx.globalAlpha = mapLayer.opacity || 0.7

    // FIXME: this should absolutely be called within some limiter, such as `requestAnimationFrame`
    // Then draw a polyline except for the lines that are along the tile extents
    // Override the layers drawing styles by passing it through to the rendering function
    PolylineFeatureRenderer.renderFeature(feature, shape, geometryOffset, ctx, mapLayer, drawingStyles, true, tileSize)
  }

  // Computes the fill and stroke styles for polygon features
  static getDrawingStylesForPolygon (feature, mapLayer) {
    // Set the default drawing styles that we will return in case we are not aggregating features
    var drawingStyles = {
      strokeStyle: mapLayer.strokeStyle,
      fillStyle: mapLayer.fillStyle,
      lineWidth: mapLayer.lineWidth || 1,
      lineOpacity: mapLayer.lineOpacity || 0.7,
      opacity: mapLayer.opacity || 0.7
    }

    // We have to calculate the fill and stroke styles based on the computed aggregate values of the feature
    var minPropertyValue = mapLayer.aggregateMinPalette || 0.0
    var maxPropertyValue = mapLayer.aggregateMaxPalette || 1.0
    var range = maxPropertyValue - minPropertyValue
    if (range === 0) {
      range = 1.0 // Prevent any divide-by-zeros
    }
    var valueToPlot = feature.properties[mapLayer.aggregateProperty]

    if (mapLayer.renderMode === 'AGGREGATE_OPACITY') {
      // Calculate the opacity at which we want to show this feature
      var minAlpha = 0.2; var maxAlpha = 0.8
      var opacity = (valueToPlot - minPropertyValue) / range * (maxAlpha - minAlpha)
      opacity = Math.max(minAlpha, opacity)
      opacity = Math.min(maxAlpha, opacity)
      drawingStyles.opacity = opacity
    } else if (mapLayer.renderMode === 'AGGREGATE_GRADIENT') {
      // Calculate the color value at which we want to show this feature
      var scaledValue = (valueToPlot - minPropertyValue) / range
      scaledValue = Math.max(0, scaledValue)
      scaledValue = Math.min(1, scaledValue)
      var fillColor = { r: Math.round(scaledValue * 255), g: Math.round((1 - scaledValue) * 255), b: 0 }
      var componentToHex = (component) => {
        var retVal = component.toString(16)
        return (retVal.length === 1) ? '0' + retVal : retVal
      }
      drawingStyles.fillStyle = '#' + componentToHex(fillColor.r) + componentToHex(fillColor.g) + componentToHex(fillColor.b)
      var strokeColor = { r: Math.max(0, fillColor.r - 20), g: Math.max(0, fillColor.g - 20), b: Math.max(0, fillColor.b - 20) }
      drawingStyles.strokeStyle = '#' + componentToHex(strokeColor.r) + componentToHex(strokeColor.g) + componentToHex(strokeColor.b)
    }
    return drawingStyles
  }
}

export default PolygonFeatureRenderer
