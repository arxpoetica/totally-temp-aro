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
    
    if (config.ui.map_tools.boundaries.view.indexOf('county_subdivisions') >= 0) {
      countySubdivisionsLayer = new MapLayer({
        short_name: 'CS',
        name: 'Counties',
        type: 'county_subdivisions',
        api_endpoint: '/county_subdivisions/36',
        highlighteable: true,
        style_options: {
          normal: {
            fillColor: 'green',
            strokeColor: 'green',
            strokeWeight: 2
          },
          highlight: {
            fillColor: 'green',
            strokeColor: 'green',
            strokeWeight: 2
          }
        },
        reload: 'always',
        threshold: 0,
        minZoom: 9,
        hoverField: 'name',
        visibilityThreshold: 1,
        isBoundaryLayer: true
      })
    }
    map_layers.addFeatureLayer(countySubdivisionsLayer);

    /*
    if (config.ui.map_tools.boundaries.view.indexOf('census_blocks') >= 0) {
      censusBlocksLayer = new MapLayer({
        type: 'census_blocks',
        short_name: 'CB',
        name: 'Census Blocks',
        api_endpoint: '/census_blocks/36/061',
        highlighteable: true,
        single_selection: true,
        reset_style_on_click: true,
        style_options: {
          normal: {
            fillColor: 'transparent',
            strokeColor: 'blue',
            strokeWeight: 2
          },
          highlight: {
            fillColor: 'transparent',
            strokeColor: 'blue',
            strokeWeight: 4
          },
          selected: {
            fillColor: 'transparent',
            strokeColor: 'blue',
            strokeWeight: 4
          }
        },
        threshold: 13,
        reload: 'dynamic',
        minZoom: 14,
        hoverField: 'name',
        clickField: 'name',
        visibilityThreshold: 1,
        isBoundaryLayer: true
      })

      map_layers.addFeatureLayer(censusBlocksLayer);
    }
	*/
    
    globalAnalysisLayers.forEach((analysisLayer) => {
      var color = analysisLayersColors.shift() || 'black'
      var layer = new MapLayer({
        name: analysisLayer.description,
        type: analysisLayer.name,
        api_endpoint: `/analysis_areas/${analysisLayer.name}`,
        style_options: {
          normal: {
            fillColor: color,
            strokeColor: color,
            strokeWeight: 2
          },
          highlight: {
            fillColor: color,
            strokeColor: color,
            strokeWeight: 2
          },
          hoverField: 'name'
        },
        reload: 'always',
        threshold: 0,
        visibilityThreshold: 1,
        isBoundaryLayer: true
      })
      this.state.boundaries.areaLayers.push(layer)
      map_layers.addFeatureLayer(layer);
    })

    this.state.boundaries.areaLayers = this.state.boundaries.areaLayers.concat([
      countySubdivisionsLayer,
      censusBlocksLayer
    ].filter((layer) => layer))
    
    
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

    //var isSelectedSA = this.state.selectedDisplayMode.getValue() === this.state.displayModes.ANALYSIS ? this.state.optimizationOptions.analysisSelectionMode == "SELECTED_AREAS" : true

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

            if (pointTransform === 'smooth') {
              mergedLayerUrls.push(url)
            } else {
              // We want to create an individual layer
              /*
            	  oldMapLayers[mapLayerKey] = {
                dataUrls: [url],
                renderMode: 'PRIMITIVE_FEATURES',
                selectable: true,
                strokeStyle: '#00ff00',
                lineWidth: 4,
                fillStyle: "transparent",
                opacity: 0.7,
                zIndex: 3500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
                highlightStyle: {
                  strokeStyle: '#000000',
                  fillStyle: 'green',
                  opacity: 0.3
                }
              }
              */
            	  
            	  var settingsKey = layer.type
            	  if ( !layerSettings.hasOwnProperty(settingsKey) ){ settingsKey = 'default' }
            	  oldMapLayers[mapLayerKey] = angular.copy(layerSettings[settingsKey])
            	  oldMapLayers[mapLayerKey].dataUrls = [url]
            	  
              this.createdMapLayerKeys.add(mapLayerKey)
            }
          }
        })
      })
    }

    if (mergedLayerUrls.length > 0) {
      // We have some business layers that need to be merged into one
      // We still have to specify an iconURL in case we want to debug the heatmap rendering. Pick any icon.
      var mapLayerKey = 'aggregated_wirecenters'
      /*
    	  oldMapLayers[mapLayerKey] = {
        dataUrls: mergedLayerUrls,
        renderMode: 'PRIMITIVE_FEATURES',
        selectable: true,
        aggregateMode: 'FLATTEN',
        strokeStyle: '#00ff00',
        lineWidth: 4,
        fillStyle: "transparent",
        opacity: 0.7,
        zIndex: 3500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
        highlightStyle: {
          strokeStyle: '#000000',
          fillStyle: 'green',
          opacity: 0.3
        }
      }
      */
    	  
    	  var settingsKey = mapLayerKey
    	  if ( !layerSettings.hasOwnProperty(settingsKey) ){ settingsKey = 'default' }
    	  
    	  oldMapLayers[mapLayerKey] = angular.copy(layerSettings[settingsKey])
    	  oldMapLayers[mapLayerKey].dataUrls = mergedLayerUrls
      this.createdMapLayerKeys.add(mapLayerKey)
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

}

BoundariesController.$inject = ['$rootScope','state','map_tools','MapLayer','map_layers','regions']

let boundaries = {
  templateUrl: '/components/views/boundaries.html',
  bindings: {},
  controller: BoundariesController
}

export default boundaries