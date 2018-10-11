import PolylineFeatureRenderer from './polyline-feature-renderer'

class PolygonFeatureRenderer {

  // First renders unselected polygon's then selected polygons
  // So selected polygon styles will be visible
  static renderFeatures(closedPolygonFeatureLayersList){

    var unselectedClosedPolygonFeatureLayersList = closedPolygonFeatureLayersList.filter((featureObj) => {
      if (featureObj.selectedDisplayMode == featureObj.displayModes.VIEW && featureObj.feature.properties.id != featureObj.selectedServiceArea) {
        return featureObj
      } else if (featureObj.selectedDisplayMode == featureObj.displayModes.ANALYSIS && !featureObj.selectedServiceAreas.has(featureObj.feature.properties.id)) {
        return featureObj
      }
    })

    var selectedClosedPolygonFeatureLayersList = closedPolygonFeatureLayersList.filter((featureObj) => {
      if (featureObj.selectedDisplayMode == featureObj.displayModes.VIEW && featureObj.feature.properties.id == featureObj.selectedServiceArea) {
        return featureObj
      } else if (featureObj.selectedDisplayMode == featureObj.displayModes.ANALYSIS && featureObj.selectedServiceAreas.has(featureObj.feature.properties.id)) {
        return featureObj
      }
    })
  
    unselectedClosedPolygonFeatureLayersList.forEach((Obj) => {
      PolygonFeatureRenderer.renderFeature(Obj.feature, Obj.shape, Obj.geometryOffset, Obj.ctx, Obj.mapLayer, Obj.censusCategories, Obj.tileDataService, Obj.styles,
        Obj.tileSize, Obj.selectedServiceArea, Obj.selectedServiceAreas, Obj.selectedDisplayMode, Obj.displayModes,
        Obj.selectedAnalysisArea, Obj.analysisSelectionMode, Obj.selectionModes, Obj.selectedCensusBlockId, Obj.selectedCensusCategoryId)
    })

    selectedClosedPolygonFeatureLayersList.forEach((Obj) => {
      PolygonFeatureRenderer.renderFeature(Obj.feature, Obj.shape, Obj.geometryOffset, Obj.ctx, Obj.mapLayer, Obj.censusCategories, Obj.tileDataService, Obj.styles,
        Obj.tileSize, Obj.selectedServiceArea, Obj.selectedServiceAreas, Obj.selectedDisplayMode, Obj.displayModes,
        Obj.selectedAnalysisArea, Obj.analysisSelectionMode, Obj.selectionModes, Obj.selectedCensusBlockId, Obj.selectedCensusCategoryId)
    })

  }

  // Renders a polygon feature onto the canvas
  static renderFeature(feature, shape, geometryOffset, ctx, mapLayer, censusCategories, tileDataService, styles, tileSize,
                       selectedServiceArea, selectedServiceAreas, selectedDisplayMode, displayModes, selectedAnalysisArea,
                       analysisSelectionMode, selectionModes, selectedCensusBlockId, selectedCensusCategoryId) {

    ctx.lineCap = 'round';
    // Get the drawing styles for rendering the polygon
    var drawingStyles = this.getDrawingStylesForPolygon(feature, mapLayer)

    // ToDo: should this go into getDrawingStylesForPolygon?
    // ToDo: use an object merge of mapLayer.highlightStyle instead having to know which attributes are implemented
    // ToDo: need to ensure feature type 
    //    a non-selected service area could have the same id as the selected census block
    if (feature.properties.hasOwnProperty('layerType')
      && 'census_block' == feature.properties.layerType) {
      if (selectedCensusBlockId == feature.properties.id) {
        // Hilight selected census block
        drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
        drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
      }

      // check for census filters
      if ('undefined' != typeof selectedCensusCategoryId
        && feature.properties.tags.hasOwnProperty(selectedCensusCategoryId)) {
        let tagId = feature.properties.tags[selectedCensusCategoryId]

        if (censusCategories[selectedCensusCategoryId].tags.hasOwnProperty(tagId)) {
          let color = censusCategories[selectedCensusCategoryId].tags[tagId].colourHash
          drawingStyles.strokeStyle = color
          drawingStyles.fillStyle = color
        }
      }

    } else if (selectedServiceAreas.has(feature.properties.id)
      && selectedDisplayMode == displayModes.ANALYSIS
      && analysisSelectionMode == selectionModes.SELECTED_AREAS) {
      //Highlight the selected SA
      //highlight if analysis mode -> selection type is service areas 
      drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
      drawingStyles.fillStyle = mapLayer.highlightStyle.fillStyle
      drawingStyles.opacity = mapLayer.highlightStyle.opacity
      drawingStyles.lineOpacity = mapLayer.highlightStyle.lineOpacity
    } else if (selectedServiceArea && (selectedServiceArea == feature.properties.id)
      && selectedDisplayMode == displayModes.VIEW) {
      //Highlight the selected SA in view mode
      drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
      drawingStyles.lineOpacity = mapLayer.highlightStyle.lineOpacity
    } else if (feature.properties.hasOwnProperty('_data_type')
      && 'analysis_area' === feature.properties._data_type
      && selectedAnalysisArea == feature.properties.id
      && selectedDisplayMode == displayModes.VIEW) {
      //Highlight the selected SA in view mode
      drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
      drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
    }
    //console.log(feature)
    if (tileDataService.modifiedBoundaries.hasOwnProperty(feature.properties.object_id)
        && 'ExistingBoundaryPointLayer' == mapLayer.tileDefinitions[0].vtlType){
      drawingStyles.strokeStyle = styles.modifiedBoundary.strokeStyle
      drawingStyles.lineOpacity = styles.modifiedBoundary.lineOpacity
    }

    ctx.fillStyle = drawingStyles.fillStyle
    ctx.globalAlpha = drawingStyles.opacity

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

    //Make Line Border is highlighted
    ctx.globalAlpha = mapLayer.opacity || 0.7

    // Then draw a polyline except for the lines that are along the tile extents
    // Override the layers drawing styles by passing it through to the rendering function
    PolylineFeatureRenderer.renderFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles, true, tileSize)
  }

  // Computes the fill and stroke styles for polygon features
  static getDrawingStylesForPolygon(feature, mapLayer) {

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
      range = 1.0  // Prevent any divide-by-zeros
    }
    var valueToPlot = feature.properties[mapLayer.aggregateProperty]

    if (mapLayer.renderMode === 'AGGREGATE_OPACITY') {
      // Calculate the opacity at which we want to show this feature
      var minAlpha = 0.2, maxAlpha = 0.8
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
