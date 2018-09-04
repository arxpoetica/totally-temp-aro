class PointFeatureRenderer {

  static renderFeature(ctx, shape, feature, featureData, geometryOffset, mapLayer, mapLayers, tileDataService,
                       selectedLocationImage, lockOverlayImage,
                       selectedDisplayMode, displayModes, analysisSelectionMode, selectedLocations, selectedViewFeaturesByType) {

    const entityImage = this.getEntityImageForFeature(feature, featureData, tileDataService)
    var selectedListType = null 
    var selectedListId = null 
    if (feature.properties.hasOwnProperty('_data_type') && "" != feature.properties._data_type){
      var fullDataType = feature.properties._data_type + '.'
      selectedListType = fullDataType.substr(0, fullDataType.indexOf('.'))
      if (feature.properties.hasOwnProperty('location_id')) {
        selectedListId = feature.properties.location_id
      } else if (feature.properties.hasOwnProperty('object_id')) {
        selectedListId = feature.properties.object_id
      } else if ( feature.properties.hasOwnProperty('id') ){
        selectedListId = feature.properties.id
      } 
    }

    var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
    var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0
    var x = shape[0].x + geometryOffset.x - imageWidthBy2
    var y = shape[0].y + geometryOffset.y - (imageHeightBy2 * 2)

    // Display individual locations. Either because we are zoomed in, or we want to debug the heatmap rendering
    const modificationType = this.getModificationTypeForFeature(feature, mapLayer, tileDataService)
    // we dont show originals when planned view is on
    if (modificationType === PointFeatureRenderer.modificationTypes.ORIGINAL && feature.properties.hasOwnProperty('_data_type')) {
      var equipmentType = feature.properties._data_type.substring(feature.properties._data_type.lastIndexOf('.') + 1)
      if (mapLayers.hasOwnProperty(equipmentType + '_planned')) {
        return
      }
    }

    if (feature.properties.location_id && selectedLocations.has(+feature.properties.location_id)
      //show selected location icon at analysis mode -> selection type is locations    
      && selectedDisplayMode == displayModes.ANALYSIS && analysisSelectionMode == "SELECTED_LOCATIONS") {
      // Draw selected icon
      ctx.drawImage(selectedLocationImage[0], x, y)
    } else if ((selectedDisplayMode == displayModes.VIEW || selectedDisplayMode == displayModes.EDIT_PLAN) // for edit mode view of existing 
      && null != selectedListId
      && null != selectedListType
      && selectedViewFeaturesByType.hasOwnProperty(selectedListType)
      && selectedViewFeaturesByType[selectedListType].hasOwnProperty(selectedListId)
    ) {
      // - Highlight this feature - //
      ctx.fillStyle = '#e8ffe8'
      ctx.strokeStyle = '#008000'
      ctx.lineWidth = 2
      //ctx.fillRect(x,y,entityImage.width,entityImage.height)
      ctx.beginPath();
      var halfWidth = 0.5 * entityImage.width
      ctx.arc(x + halfWidth, y + (0.5 * entityImage.height), halfWidth + 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(entityImage, x, y)
    } else {
      const originalAlpha = ctx.globalAlpha
      if (modificationType === PointFeatureRenderer.modificationTypes.ORIGINAL || modificationType === PointFeatureRenderer.modificationTypes.DELETED) {
        ctx.globalAlpha = 0.5
      }
      // Increase the size of household icon if entity_count > 1
      if (feature.properties.entity_count && feature.properties.entity_count > 1) {
        ctx.drawImage(entityImage, x, y, entityImage.width * 1.3, entityImage.height * 1.3)
      } else {
        ctx.drawImage(entityImage, x, y)
      }
      ctx.globalAlpha = originalAlpha
    }
    const overlaySize = 12
    this.renderModificationOverlay(ctx, x + entityImage.width - overlaySize, y, overlaySize, overlaySize, modificationType)

    this.renderFeatureLabels(ctx, mapLayer, feature, x + imageWidthBy2, y + imageHeightBy2, imageHeightBy2 * 2)
    // Draw lock overlay if required
    if (feature.properties.is_locked) {
      ctx.drawImage(lockOverlayImage[0], x - 4, y - 4)
    }
  }

  // Gets the modification type for a given feature
  static getModificationTypeForFeature(feature, mapLayer, tileDataService) {
    // If this feature is a "modified feature" then add an overlay. (Its all "object_id" now, no "location_id" anywhere)
    var modificationType = PointFeatureRenderer.modificationTypes.UNMODIFIED
    if (tileDataService.modifiedFeatures.hasOwnProperty(feature.properties.object_id)) {
      const modifiedFeature = tileDataService.modifiedFeatures[feature.properties.object_id]
      if (modifiedFeature.deleted) {
        modificationType = PointFeatureRenderer.modificationTypes.DELETED
      } else {
        if ('LibraryEquipmentPointLayer' == mapLayer.tileDefinitions[0].vtlType) {
          modificationType = PointFeatureRenderer.modificationTypes.ORIGINAL
        } else {
          modificationType = PointFeatureRenderer.modificationTypes.MODIFIED
        }
      }
    }
    return modificationType
  }

  static getEntityImageForFeature(feature, featureData) {
    var entityImage = featureData.icon
    if (feature.properties.hasOwnProperty('_data_type') && "" != feature.properties._data_type) {
      if (feature.properties.hasOwnProperty('object_id')) {
        //greyout an RT with hsiEanbled true for frontier client
        if (config.ARO_CLIENT === 'frontier' &&
            (feature.properties._data_type === 'equipment.central_office' || feature.properties._data_type === 'equipment.dslam')
            && (feature.properties.hsiEnabled !== 'true')) {
          entityImage = featureData.greyOutIcon
        }
      }
    }
    return entityImage
  }

  // Renders a "modification" overlay over a feature icon
  static renderModificationOverlay(ctx, x, y, width, height, modificationType) {

    if (modificationType === PointFeatureRenderer.modificationTypes.UNMODIFIED) {
      return  // Unmodified feature, nothing to do
    }

    var overlayText = ''
    switch (modificationType) {
      case PointFeatureRenderer.modificationTypes.ORIGINAL: overlayText = 'O'; break;
      case PointFeatureRenderer.modificationTypes.MODIFIED: overlayText = 'M'; break;
      case PointFeatureRenderer.modificationTypes.DELETED: overlayText = 'D'; break;
    }

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.fill()
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.font = '9px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText(overlayText, x + width / 2, y + height / 2)
  }

  // Renders labels for a feature
  static renderFeatureLabels(ctx, mapLayer, feature, featureCenterX, featureCenterY, featureIconHeight) {

    if (!mapLayer.drawingOptions || !mapLayer.drawingOptions.labels) {
      return  // Nothing to draw
    }

    const labelMargin = 5, labelPadding = 3
    var labelYOffset = 0
    mapLayer.drawingOptions.labels.properties.forEach((labelProperty) => {
      // Calculate the center of the label
      var labelCenterX = featureCenterX, labelCenterY = featureCenterY
      switch (mapLayer.drawingOptions.labels.align) {
        case 'bottom':
          labelCenterX = featureCenterX;
          labelCenterY = featureCenterY + featureIconHeight / 2 + labelMargin + labelPadding + mapLayer.drawingOptions.labels.fontSize / 2
          break;
        case 'top':
          labelCenterX = featureCenterX;
          labelCenterY = featureCenterY - (featureIconHeight / 2 + labelMargin + labelPadding + mapLayer.drawingOptions.labels.fontSize / 2)
          break;
      }
      labelCenterY += labelYOffset
      // Draw the box for the label
      const fontSize = mapLayer.drawingOptions.labels.fontSize
      ctx.font = `${fontSize}px ${mapLayer.drawingOptions.labels.fontFamily}`
      const labelText = feature.properties[labelProperty]
      const textMetrics = ctx.measureText(labelText)
      ctx.strokeStyle = mapLayer.drawingOptions.labels.borderColor
      ctx.fillStyle = mapLayer.drawingOptions.labels.fillColor
      ctx.lineWidth = 1
      ctx.beginPath()
      const rectHeight = fontSize + labelPadding * 2
      ctx.rect(labelCenterX - textMetrics.width / 2 - labelPadding, labelCenterY - fontSize / 2 - labelPadding,
        textMetrics.width + labelPadding * 2, rectHeight)
      ctx.fill()
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeStyle = mapLayer.drawingOptions.labels.textColor
      ctx.fillStyle = mapLayer.drawingOptions.labels.textColor
      ctx.fillText(labelText, labelCenterX, labelCenterY)
      labelYOffset += rectHeight
    })
  }
}

PointFeatureRenderer.modificationTypes = Object.freeze({
  UNMODIFIED: 'UNMODIFIED',
  ORIGINAL: 'ORIGINAL',
  MODIFIED: 'MODIFIED',
  DELETED: 'DELETED'
})

export default PointFeatureRenderer
