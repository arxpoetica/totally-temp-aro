class BoundariesController {

  constructor($rootScope,$http,state,map_tools,MapLayer,map_layers,regions,configuration) {

    this.$http = $http
    this.state = state
    this.regions = regions
    this.map_tools = map_tools
    this.configuration = configuration

    var countySubdivisionsLayer
    var censusBlocksLayer

    // Creates map layers based on selection in the UI
    this.createdMapLayerKeys = new Set()

    this.selectedCensusCat

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
    
    $rootScope.$on('configuration_loaded', () => {
      globalServiceLayers.forEach((serviceLayer) => {
        if (!serviceLayer.show_in_boundaries) return
        var wirecenter_layer = {
          name: serviceLayer.description, //serviceLayer.description, // Service Areas 
          type: 'wirecenter',
          layerId: serviceLayer.id
        }

        wirecenter_layer.visible_check = this.configuration.boundaryCategories.categories[wirecenter_layer.type].visible_check
        this.state.boundaries.tileLayers.push(wirecenter_layer)
      })

      this.state.boundaries.tileLayers.push({
        name: 'Census Blocks',
        type: 'census_blocks'
      })
    })
  }
  
  onSelectCensusCat(){
    let id = null
    if (null != this.selectedCensusCat) id = this.selectedCensusCat.id
    this.state.reloadSelectedCensusCategoryId(id)
  }
  
  // for layers drawn on vector tiles
  tilesToggleVisibility(layer) {
    layer.visible = layer.visible_check;
    this.updateMapLayers()
    //this.state.resetBoundarySearch.next(true)
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
    var layerSettings = this.configuration.boundaryCategories && this.configuration.boundaryCategories.categories
    
    if(layerSettings && layerSettings['wirecenter'])
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
            var layerOptions = layerSettings[layer.type]
            var pointTransform = this.getPointTransformForLayer(+layerOptions.aggregateZoomThreshold)
            var mapLayerKey = `${pointTransform}_${layer.type}_${selectedServiceAreaLibrary.identifier}`

            var settingsKey
            pointTransform === 'smooth' ? settingsKey = 'aggregated_' + layer.type : settingsKey = layer.type

            if (!layerSettings.hasOwnProperty(settingsKey)) { settingsKey = 'default' }
            oldMapLayers[mapLayerKey] = angular.copy(layerSettings[settingsKey])
            var tileDefinition = angular.copy(layerOptions.tileDefinition)
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
    this.state.StateViewMode.loadEntityList(this.$http,this.state,'AnalysisLayer',null,'id,name,description',null)
    .then(() => {
      this.state.entityTypeList.AnalysisLayer.forEach((analysisLayer) => {
        this.state.boundaries.tileLayers.push({
          name: analysisLayer.description,
          type: 'analysis_layer',
          analysisLayerId: analysisLayer.id
        })
      })

      //enable wirecenter for frontier by default
      this.state.boundaries.tileLayers.forEach((tileLayers) => {
        tileLayers.type === 'wirecenter' && this.tilesToggleVisibility(tileLayers)
      })
    })

  }

}

BoundariesController.$inject = ['$rootScope','$http','state','map_tools','MapLayer','map_layers','regions','configuration']

let boundaries = {
  templateUrl: '/components/views/boundaries.html',
  bindings: {},
  controller: BoundariesController
}

export default boundaries