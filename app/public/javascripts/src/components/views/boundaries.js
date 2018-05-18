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
        type: serviceLayer.name,
        api_endpoint: "/tile/v1/service_area/tiles/${layerId}/${tilePointTransform}/",
        layerId: serviceLayer.id,
        aggregateZoomThreshold: 10
      }
    
      this.state.boundaries.tileLayers.push(wirecenter_layer)
    })
    
    
    this.state.boundaries.tileLayers.push({
    	  name: 'Census Blocks',
      type: 'census_blocks',
      api_endpoint: "/tile/v1/census_block/tiles/${tilePointTransform}/",
      //layerId: serviceLayer.id,
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
    this.updateMapLayers()
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
      strokeStyle: '#333333',
      lineWidth: 1,
      fillStyle: "transparent",
      opacity: 0.7,
      zIndex: 3520, // ToDo: MOVE THIS TO A SETTINGS FILE!
      highlightStyle: {
        lineWidth: 8
      }
    }
    
    layerSettings['analysis_layer'] = {
      dataUrls: [],
      renderMode: 'PRIMITIVE_FEATURES',
      selectable: true,
      strokeStyle: '#333333',
      lineWidth: 1,
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
      
    layerSettings['aggregated_analysis_layer'] = layerSettings['aggregated_census_blocks']
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

            var url = layer.api_endpoint.replace('${tilePointTransform}', pointTransform)
            url = url.replace('${layerId}', selectedServiceAreaLibrary.identifier)
            url = url.replace('${analysisLayerId}', layer.analysisLayerId)

            var settingsKey
            pointTransform === 'smooth' ? settingsKey = 'aggregated_' + layer.type : settingsKey = layer.type

            if (!layerSettings.hasOwnProperty(settingsKey)) { settingsKey = 'default' }
            oldMapLayers[mapLayerKey] = angular.copy(layerSettings[settingsKey])
            oldMapLayers[mapLayerKey].dataUrls = [url]
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
          analysisLayerId: analysisLayer.id,
          aggregateZoomThreshold: 10
        })
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