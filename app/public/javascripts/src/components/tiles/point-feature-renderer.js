import WorkflowState from '../../shared-utils/workflow-state'
// temporary 
import PlanEditorSelectors from '../../react/components/plan-editor/plan-editor-selectors.js'

class PointFeatureRenderer {
  // I can not wait to rewrite this whole system!!!
  static renderFeatures (pointFeatureRendererList, ARO_CLIENT, selectedSubnetLocations = {}, locationAlerts = {}) {
    var deletedPointFeatureRendererList = pointFeatureRendererList.filter((featureObj) => {
      if (this.getModificationTypeForFeature(featureObj.feature, featureObj.mapLayer, featureObj.tileDataService) === PointFeatureRenderer.modificationTypes.DELETED) {
        return featureObj
      }
    })

    var unDeletedPointFeatureRendererList = pointFeatureRendererList.filter((featureObj) => {
      if (this.getModificationTypeForFeature(featureObj.feature, featureObj.mapLayer, featureObj.tileDataService) !== PointFeatureRenderer.modificationTypes.DELETED) {
        return featureObj
      }
    })

    deletedPointFeatureRendererList.forEach((Obj) => {
      PointFeatureRenderer.renderFeature(Obj.ctx, Obj.shape, Obj.feature, Obj.featureData, Obj.geometryOffset, Obj.mapLayer, Obj.mapLayers, Obj.tileDataService,
        Obj.selection, Obj.oldSelection, Obj.selectedLocationImage, Obj.lockOverlayImage, Obj.invalidatedOverlayImage,
        Obj.selectedDisplayMode, Obj.displayModes, Obj.analysisSelectionMode, Obj.selectionModes, Obj.equipmentLayerTypeVisibility,
        ARO_CLIENT, selectedSubnetLocations, locationAlerts)
    })

    unDeletedPointFeatureRendererList.forEach((Obj) => {
      PointFeatureRenderer.renderFeature(Obj.ctx, Obj.shape, Obj.feature, Obj.featureData, Obj.geometryOffset, Obj.mapLayer, Obj.mapLayers, Obj.tileDataService,
        Obj.selection, Obj.oldSelection, Obj.selectedLocationImage, Obj.lockOverlayImage, Obj.invalidatedOverlayImage,
        Obj.selectedDisplayMode, Obj.displayModes, Obj.analysisSelectionMode, Obj.selectionModes, Obj.equipmentLayerTypeVisibility,
        ARO_CLIENT, selectedSubnetLocations, locationAlerts)
    })
  }

  static renderFeature (ctx, shape, feature, featureData, geometryOffset, mapLayer, mapLayers, tileDataService,
    selection, oldSelection, selectedLocationImage, lockOverlayImage, invalidatedOverlayImage,
    selectedDisplayMode, displayModes, analysisSelectionMode, selectionModes, equipmentLayerTypeVisibility, 
    ARO_CLIENT, selectedSubnetLocations, locationAlerts) 
  {

    var entityImage = this.getEntityImageForFeature(feature, featureData, ARO_CLIENT, mapLayer)
    var selectedListType = null
    var selectedListId = null
    if (feature.properties.hasOwnProperty('_data_type') && feature.properties._data_type != '') {
      var fullDataType = feature.properties._data_type + '.'
      selectedListType = fullDataType.substr(0, fullDataType.indexOf('.'))
      if (feature.properties.hasOwnProperty('location_id')) {
        selectedListId = feature.properties.location_id
      } else if (feature.properties.hasOwnProperty('object_id')) {
        selectedListId = feature.properties.object_id
      } else if (feature.properties.hasOwnProperty('id')) {
        selectedListId = feature.properties.id
      }
    }

    // this may not be in the right place but this whole system is a mess so ...
    if (selectedDisplayMode === displayModes.EDIT_PLAN) {
      let newGlobalAlpha = 0.333 // equipment
      // not sure if this is reliable 
      if (feature.properties._data_type && feature.properties._data_type === 'location') {
        newGlobalAlpha = 0.4
        if (selectedSubnetLocations[feature.properties.object_id]) newGlobalAlpha = 1.0
        if (locationAlerts[feature.properties.object_id]) {
          newGlobalAlpha = 1.0
          entityImage = PlanEditorSelectors.locationWarnImgByType[feature.properties.location_entity_type]
        }
      }
      ctx.globalAlpha = newGlobalAlpha
    }

    var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
    var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0
    var x = shape[0].x + geometryOffset.x - imageWidthBy2
    var y = shape[0].y + geometryOffset.y - (imageHeightBy2 * 2)

    // Display individual locations. Either because we are zoomed in, or we want to debug the heatmap rendering
    const modificationType = this.getModificationTypeForFeature(feature, mapLayer, tileDataService)

    if (!(equipmentLayerTypeVisibility.existing && equipmentLayerTypeVisibility.planned) &&
        // When both exisiting and planned are turnned on show deleted,original,modified and exisiting
        (modificationType === PointFeatureRenderer.modificationTypes.ORIGINAL || modificationType === PointFeatureRenderer.modificationTypes.DELETED) &&
        // we dont show originals/deleted when only planned view is on
        feature.properties.hasOwnProperty('_data_type')) {
      var equipmentType = feature.properties._data_type.substring(feature.properties._data_type.lastIndexOf('.') + 1)
      if (mapLayers.hasOwnProperty(equipmentType + '_planned')) {
        return
      }
    }
    
    if (feature.properties.object_id && selection.planTargets.locations.has(feature.properties.object_id) &&
        // show selected location icon at analysis mode -> selection type is locations
        selectedDisplayMode == displayModes.ANALYSIS && analysisSelectionMode == selectionModes.SELECTED_LOCATIONS) {
      // Draw selected icon
      ctx.drawImage(selectedLocationImage[0], x, y)
  //} else if ((selectedDisplayMode == displayModes.VIEW || selectedDisplayMode == displayModes.EDIT_PLAN) && // for edit mode view of existing
    } else if (selectedDisplayMode === displayModes.VIEW && // for edit mode view of existing
               selectedListId != null &&
               selectedListType != null &&
               oldSelection.editable.hasOwnProperty(selectedListType) &&
               oldSelection.editable[selectedListType].hasOwnProperty(selectedListId)) {
      // - Highlight this feature - //
      ctx.fillStyle = '#e8ffe8'
      ctx.strokeStyle = '#008000'
      ctx.lineWidth = 2
      ctx.beginPath()
      var halfWidth = 0.5 * entityImage.width
      ctx.arc(x + halfWidth, y + (0.5 * entityImage.height), halfWidth + 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      ctx.drawImage(entityImage, x, y)
    } else {
      const originalAlpha = ctx.globalAlpha
      if (modificationType === PointFeatureRenderer.modificationTypes.ORIGINAL || modificationType === PointFeatureRenderer.modificationTypes.DELETED) {
        ctx.globalAlpha = 0.5
      }
      // Increase the size of household icon if entity_count > 1
      ctx.drawImage(entityImage, x, y)
      ctx.globalAlpha = originalAlpha
    }
    const overlaySize = 12
    this.renderModificationOverlay(ctx, x + entityImage.width - overlaySize, y, overlaySize, overlaySize, modificationType)

    this.renderFeatureLabels(ctx, mapLayer, feature, x + imageWidthBy2, y + imageHeightBy2, entityImage.width, entityImage.height)
    // Draw locked/invalidated overlays if required. The backend currently stores workflow_state as an enum, but
    // they are numbered such that they can be considered as bitfields. So we can have multiple concurrent workflow states in theory.
    if (feature.properties.workflow_state_id & WorkflowState.LOCKED.id) {
      ctx.drawImage(lockOverlayImage, x - 4, y - 4)
    }
    if (feature.properties.workflow_state_id & WorkflowState.INVALIDATED.id) {
      ctx.drawImage(invalidatedOverlayImage, x - 4, y + 8)
    }
  }

  // Gets the modification type for a given feature
  static getModificationTypeForFeature (feature, mapLayer, tileDataService) {
    // If this feature is a "modified feature" then add an overlay. (Its all "object_id" now, no "location_id" anywhere)
    var modificationType = PointFeatureRenderer.modificationTypes.UNMODIFIED
    if (tileDataService.modifiedFeatures.hasOwnProperty(feature.properties.object_id)) {
      const modifiedFeature = tileDataService.modifiedFeatures[feature.properties.object_id]
      if (modifiedFeature.deleted) {
        modificationType = PointFeatureRenderer.modificationTypes.DELETED
      } else {
        if (mapLayer.tileDefinitions[0].vtlType == 'LibraryEquipmentPointLayer') {
          modificationType = PointFeatureRenderer.modificationTypes.ORIGINAL
        } else {
          modificationType = PointFeatureRenderer.modificationTypes.MODIFIED
        }
      }
    }
    return modificationType
  }

  static getEntityImageForFeature (feature, featureData, ARO_CLIENT, mapLayer) {
    var entityImage = featureData.icon
    if (feature.v2Result && feature.v2Result.iconUrl) {
      entityImage = featureData.v2FilterIcons[feature.v2Result.iconUrl]
    }

    if (feature.properties.hasOwnProperty('_data_type') && feature.properties._data_type != '') {
      if (feature.properties.hasOwnProperty('object_id')) {
        // greyout an RT with hsiEanbled true for frontier client
        if (ARO_CLIENT === 'frontier' &&
            (feature.properties._data_type === 'equipment.central_office' || feature.properties._data_type === 'equipment.dslam') &&
            (feature.properties.hsiEnabled !== 'true')) {
          entityImage = featureData.greyOutIcon
        }
        if (feature.properties.entity_count &&
            feature.properties.entity_count > 1 &&
            mapLayer.mduIconUrl) {
          entityImage = featureData.mduIcon
        }
      }
    }
    return entityImage
  }

  // Renders a "modification" overlay over a feature icon
  static renderModificationOverlay (ctx, x, y, width, height, modificationType) {
    if (modificationType === PointFeatureRenderer.modificationTypes.UNMODIFIED) {
      return // Unmodified feature, nothing to do
    }

    var overlayText = ''
    switch (modificationType) {
      case PointFeatureRenderer.modificationTypes.ORIGINAL: overlayText = 'O'; break
      case PointFeatureRenderer.modificationTypes.MODIFIED: overlayText = 'M'; break
      case PointFeatureRenderer.modificationTypes.DELETED: overlayText = 'D'; break
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
  static renderFeatureLabels (ctx, mapLayer, feature, featureCenterX, featureCenterY, featureIconWidth, featureIconHeight) {
    if (!mapLayer.drawingOptions || !mapLayer.drawingOptions.labels) {
      return // Nothing to draw
    }

    const labelMargin = mapLayer.drawingOptions.labels.labelMargin; const labelPadding = mapLayer.drawingOptions.labels.labelPadding
    var labelYOffset = 0
    mapLayer.drawingOptions.labels.properties.forEach((labelProperty) => {
      // Calculate the center of the label
      var labelCenterX = featureCenterX; var labelCenterY = featureCenterY
      switch (mapLayer.drawingOptions.labels.align) {
        case 'bottom':
          labelCenterX = featureCenterX
          labelCenterY = featureCenterY + featureIconHeight / 2 + labelMargin + labelPadding + mapLayer.drawingOptions.labels.fontSize / 2
          break
        case 'top':
          labelCenterX = featureCenterX
          labelCenterY = featureCenterY - (featureIconHeight / 2 + labelMargin + labelPadding + mapLayer.drawingOptions.labels.fontSize / 2)
          break
      }
      labelCenterY += labelYOffset
      // Draw the box for the label
      const fontSize = mapLayer.drawingOptions.labels.fontSize
      ctx.font = (mapLayer.drawingOptions.labels.fontBold ? 'bold ' : '') + `${fontSize}px ${mapLayer.drawingOptions.labels.fontFamily}`
      const labelText = feature.properties[labelProperty]
      const textMetrics = ctx.measureText(labelText)
      const rectHeight = fontSize + labelPadding * 2
      ctx.lineWidth = 1
      if (mapLayer.drawingOptions.labels.borderColor || mapLayer.drawingOptions.labels.fillColor) {
        ctx.strokeStyle = mapLayer.drawingOptions.labels.borderColor || '#000000'
        ctx.fillStyle = mapLayer.drawingOptions.labels.fillColor || '#ffffff'
        ctx.beginPath()
        ctx.rect(labelCenterX - textMetrics.width / 2 - labelPadding, labelCenterY - fontSize / 2 - labelPadding,
          textMetrics.width + labelPadding * 2, rectHeight)
        if (mapLayer.drawingOptions.labels.fillColor) {
          ctx.fill()
        }
        if (mapLayer.drawingOptions.labels.fillColor) {
          ctx.stroke()
        }
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (mapLayer.drawingOptions.labels.textFillColor) {
        ctx.fillStyle = mapLayer.drawingOptions.labels.textFillColor
        ctx.fillText(labelText, labelCenterX, labelCenterY)
      }
      if (mapLayer.drawingOptions.labels.textStrokeColor) {
        ctx.strokeStyle = mapLayer.drawingOptions.labels.textStrokeColor
        ctx.strokeText(labelText, labelCenterX, labelCenterY)
      }
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
