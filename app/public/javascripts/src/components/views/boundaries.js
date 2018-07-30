class BoundariesController {

  constructor($rootScope,state,map_tools,MapLayer,map_layers,regions) {

    this.state = state
    this.regions = regions
    this.map_tools = map_tools

    var countySubdivisionsLayer
    var censusBlocksLayer
    var analysisLayersColors = ['coral']
    var serviceLayersColors = [
      '#00ff00', 'coral', 'darkcyan', 'dodgerblue'
    ]

    // Creates map layers based on selection in the UI
    this.createdMapLayerKeys = new Set()

    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', this.updateMapLayers.bind(this))

    // Update map layers when the dataItems property of state changes
    this.state.dataItemsChanged.subscribe((newValue) => this.updateMapLayers())

    // Update map layers when the selection type in analysis mode changes
    this.state.selectionTypeChanged.subscribe((newValue) => this.updateMapLayers())

    // Update map layers when the display mode button changes
    this.state.selectedDisplayMode.subscribe((newValue) => this.updateMapLayers())
    
    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
    })
    
    globalServiceLayers.forEach((serviceLayer) => {
      if (!serviceLayer.show_in_boundaries) return
      var wirecenter_layer = {
        name: serviceLayer.description, //serviceLayer.description, // Service Areas 
        type: 'wirecenter',
        api_endpoint: '/tile/v1/service_area/tiles/${layerId}/${tilePointTransform}/',
        tileDefinition: {
          dataId: 'v1.tiles.service_area_by_library.{libraryId}.{transform}',
          vtlType: 'ServiceAreaLayerByLibrary',
          libraryId: '{libraryId}',
          transform: '{transform}'
        },
        layerId: serviceLayer.id,
        visible: false,
        disabled: false,
        aggregateZoomThreshold: 10
      }
      
      wirecenter_layer.visible_check = config.ARO_CLIENT === 'frontier' //enable wirecenter for frontier by default
      this.state.boundaries.tileLayers.push(wirecenter_layer)
    })
    
    
    this.state.boundaries.tileLayers.push({
    	name: 'Census Blocks',
      type: 'census_blocks',
      api_endpoint: "/tile/v1/census_block/tiles/${tilePointTransform}/",
      tileDefinition: {
        dataId: 'v1.tiles.census_block.{transform}',
        vtlType: 'CensusBlockLayer',
        transform: '{transform}'
      },
    //layerId: serviceLayer.id,
      visible: false,
      disabled: false,
      aggregateZoomThreshold: 10
    	  
    })
    
    this.selectedCensusCat
    
  }
  
  
  onSelectCensusCat(){
    let id = null
    if (null != this.selectedCensusCat) id = this.selectedCensusCat.id
    this.state.reloadSelectedCensusCategoryId(id)
  }
  
  // for MapLayer objects 
  toggleVisibility(layer) {
	 layer.visible = layer.visible_check;
   layer.configureVisibility()
   this.regions.setSearchOption(layer.type, layer.visible)
  }
  
  // for layers drawn on vector tiles
  tilesToggleVisibility(layer) {
    layer.visible = layer.visible_check;
    //this.disableOtherLayers()
    this.updateMapLayers()
    //this.state.resetBoundarySearch.next(true)
  }
  
  layerView(mode) {
    this.state.activeboundaryLayerMode = this.state.boundaryLayerMode[mode]
    this.state.activeboundaryLayerMode === this.state.boundaryLayerMode.VIEW && this.enableAllLayers()
    this.state.activeboundaryLayerMode === this.state.boundaryLayerMode.SEARCH && this.clearLayerSelections()
  }

  enableAllLayers() {
    this.state.boundaries.tileLayers.forEach((boundaryLayer) => {
      boundaryLayer.disabled = false
    })
  }

  clearLayerSelections() {
    this.state.activeViewModePanel = this.state.viewModePanels.BOUNDARIES_INFO
    this.state.boundaries.tileLayers.forEach((boundaryLayer) => {
      boundaryLayer.visible_check = false
      boundaryLayer.visible = boundaryLayer.visible_check;
    })
    this.updateMapLayers()
  }

  disableOtherLayers() {
    // if(this.state.activeViewModePanel === this.state.viewModePanels.BOUNDARIES_INFO && 
    //   this.state.activeboundaryLayerMode === this.state.boundaryLayerMode.SEARCH) {
    if(this.state.activeboundaryLayerMode === this.state.boundaryLayerMode.SEARCH) {
      var isOneLayerEnable = false
      this.state.boundaries.tileLayers.forEach((boundary) => {
        if (boundary.visible) isOneLayerEnable = true
      })
      if(isOneLayerEnable) {
        _.filter(this.state.boundaries.tileLayers,(boundary) => !boundary.visible).forEach((boundary) => {
          boundary.disabled = true
        })
      } else {
        this.enableAllLayers()
      }
    }  
  }

  // Replaces any occurrences of searchText by replaceText in the keys of an object
  objectKeyReplace(obj, searchText, replaceText) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchText, replaceText)
      }
    })
  }
  
  updateMapLayers() {
    // ToDo: this function could stand to be cleaned up
    
    // ToDo: layerSettings will come from settings, possibly by way of one of the other arrays  
    var layerSettings = {}
    layerSettings['wirecenter'] = {
      dataUrls: [],
      renderMode: 'PRIMITIVE_FEATURES',
      selectable: true,
      strokeStyle: '#00ff00',
      lineWidth: 4,
      fillStyle: "transparent",
      opacity: 0.7,
      zIndex: 3510, // ToDo: MOVE THIS TO A SETTINGS FILE!
      highlightStyle: {
        strokeStyle: '#000000',
        fillStyle: 'green',
        opacity: 0.3
      }
    }

    layerSettings['census_blocks'] = {
      dataUrls: [],
      renderMode: 'PRIMITIVE_FEATURES',
      selectable: true,
      strokeStyle: '#d3db43',
      lineWidth: 1,
      fillStyle: "transparent",
      opacity: 0.7,
      zIndex: 3520, // ToDo: MOVE THIS TO A SETTINGS FILE!
      highlightStyle: {
        lineWidth: 8
      }
    }
    if(config.ARO_CLIENT === 'frontier') {
      layerSettings['census_blocks']['strokeStyle'] = '#000000'
      layerSettings['census_blocks']['opacity'] = 0.5
    }

    layerSettings['analysis_layer'] = layerSettings['aggregated_analysis_layer'] = {
      dataUrls: [],
      renderMode: 'PRIMITIVE_FEATURES',
      selectable: true,
      strokeStyle: '#ff0000',
      lineWidth: 2,
      fillStyle: "transparent",
      opacity: 0.7,
      zIndex: 3530, // ToDo: MOVE THIS TO A SETTINGS FILE!
      highlightStyle: {
        strokeStyle: '#000000',
        lineWidth: 8
      }
    }
    
    layerSettings['aggregated_wirecenters'] = {
      dataUrls: [],
      renderMode: 'PRIMITIVE_FEATURES',
      selectable: true,
      aggregateMode: 'FLATTEN',
      strokeStyle: '#00ff00',
      lineWidth: 1,
      fillStyle: "transparent",
      opacity: 0.7,
      zIndex: 3500, // ToDo: MOVE THIS TO A SETTINGS FILE!
      highlightStyle: {
        strokeStyle: '#000000',
        fillStyle: 'green',
        opacity: 0.3, 
        lineWidth: 8
      }
    }

    layerSettings['aggregated_census_blocks'] = {
      dataUrls: [],
      renderMode: 'PRIMITIVE_FEATURES',
      selectable: true,
      aggregateMode: 'FLATTEN',
      strokeStyle: '#333333',
      lineWidth: 1,
      fillStyle: "transparent",
      opacity: 0.7,
      zIndex: 3540, // ToDo: MOVE THIS TO A SETTINGS FILE!
      highlightStyle: {
        strokeStyle: '#000000',
        fillStyle: 'green',
        opacity: 0.3,
        lineWidth: 8
      }
    }
      
    layerSettings['default'] = layerSettings['wirecenter']
    	  
    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    this.createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })

    this.createdMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    var mergedLayerUrls = []

    // Add map layers based on the selection
    var selectedServiceAreaLibraries = this.state.dataItems && this.state.dataItems.service_layer && this.state.dataItems.service_layer.selectedLibraryItems
    if (selectedServiceAreaLibraries) {
      selectedServiceAreaLibraries.forEach((selectedServiceAreaLibrary) => {
        
        this.state.boundaries.tileLayers.forEach((layer) => {
          if (layer.visible) {
            var pointTransform = this.getPointTransformForLayer(+layer.aggregateZoomThreshold)
            var mapLayerKey = `${pointTransform}_${layer.type}_${selectedServiceAreaLibrary.identifier}`

            var settingsKey
            pointTransform === 'smooth' ? settingsKey = 'aggregated_' + layer.type : settingsKey = layer.type

            if (!layerSettings.hasOwnProperty(settingsKey)) { settingsKey = 'default' }
            oldMapLayers[mapLayerKey] = angular.copy(layerSettings[settingsKey])
            var tileDefinition = angular.copy(layer.tileDefinition)
            this.objectKeyReplace(tileDefinition, '{transform}', pointTransform)
            this.objectKeyReplace(tileDefinition, '{libraryId}', selectedServiceAreaLibrary.identifier)
            this.objectKeyReplace(tileDefinition, '{analysisLayerId}', layer.analysisLayerId)
            oldMapLayers[mapLayerKey].tileDefinitions = [tileDefinition]
            this.createdMapLayerKeys.add(mapLayerKey)
          }
        })
      })
    }

    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  // Get the point transformation mode with the current zoom level
  getPointTransformForLayer(zoomThreshold) {
    var mapZoom = map.getZoom()
    // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
    // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
    return (mapZoom > zoomThreshold) ? 'select' : 'smooth'
  }

  $onInit() {
    this.state.loadEntityList('AnalysisLayer',null,'id,name,description',null)
    .then(() => {
      this.state.entityTypeList.AnalysisLayer.forEach((analysisLayer) => {
        this.state.boundaries.tileLayers.push({
          name: analysisLayer.description,
          type: 'analysis_layer',
          api_endpoint: "/tile/v1/analysis_area/tiles/${analysisLayerId}/${tilePointTransform}/",
          tileDefinition: {
            dataId: 'v1.tiles.analysis_area.{analysisLayerId}.{transform}',
            vtlType: 'AnalysisAreaLayer',
            polyTransform: '{transform}',
            analysisLayerId: '{analysisLayerId}'
          },
          analysisLayerId: analysisLayer.id,
          visible: false,
          disabled: false,
          aggregateZoomThreshold: 10
        })
      })

      //enable wirecenter for frontier by default
      this.state.boundaries.tileLayers.forEach((tileLayers) => {
        tileLayers.type === 'wirecenter' && this.tilesToggleVisibility(tileLayers)
      })
    })
  }

}

BoundariesController.$inject = ['$rootScope','state','map_tools','MapLayer','map_layers','regions']

let boundaries = {
  templateUrl: '/components/views/boundaries.html',
  bindings: {},
  controller: BoundariesController
}

export default boundaries