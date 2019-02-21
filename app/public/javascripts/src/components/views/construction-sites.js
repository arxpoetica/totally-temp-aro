import { createSelector } from 'reselect'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
// const getAllConstructionLayers = reduxState => reduxState.mapLayers.location
// const getConstructionLayersList = createSelector([getAllConstructionLayers], (constructionLayers) => constructionLayers.toJS())

class ConstructionSitesController {
  
  constructor($rootScope, $ngRedux, map_tools, state) {

    this.map_tools = map_tools
    this.state = state
    this.selected_tool = null

    this.roadLayer = {
      short_name: 'RS',
      name: 'Road Segments',
      type: 'road_segments',
      style_options: {
        normal: {
          strokeColor: 'teal',
          strokeWeight: 2
        },
        highlight: {
          strokeColor: '#b34d4d',
          strokeWeight: 4
        }
      },
      libraryId: 2,
      aggregateZoomThreshold: 15,
      visible: false,
      tileDefinition: {
        dataId: 'v1.tiles.edge.{libraryId}.{transform}',
        vtlType: 'EdgeLayer',
        libraryId: '{libraryId}',
        transform: '{transform}'
      },
      threshold: 12,
      reload: 'always'
    }
  
    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', () => this.updateMapLayers())

    this.createdMapLayerKeys = new Set()

    //this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))    
  }

  $onInit() {
    if(config.ARO_CLIENT === 'frontier') {
      this.roadLayer.style_options.normal.strokeColor = '#ffffff'
      this.roadLayer.style_options.normal.strokeWeight = 5
      this.roadLayer.style_options.highlight.strokeWeight = 6
    }
  }

  toggleRoadLayer() {
    this.updateMapLayers()
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

  // Make a copy of the state mapLayers. We will update this
  var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

  // Remove all the map layers previously created by this controller
  this.createdMapLayerKeys.forEach((createdRoadMapLayerKey) => {
    delete oldMapLayers[createdRoadMapLayerKey]
  })

  this.createdMapLayerKeys.clear()

  // Hold a list of layers that we want merged
  var layer = this.roadLayer;
  var selectedEdgeLibraries = this.state.dataItems && this.state.dataItems.edge && this.state.dataItems.edge.selectedLibraryItems

  if (layer.visible && selectedEdgeLibraries) {
    selectedEdgeLibraries.forEach((selectedEdgeLibrary) => {
      // Location type is visible
      var mapZoom = map.getZoom()
      var pointTransform = (mapZoom > layer.aggregateZoomThreshold) ? 'select' : 'smooth_relative'
      var mapLayerKey = `${pointTransform}_${layer.type}_${selectedEdgeLibrary.identifier}`

      var tileDefinition = angular.copy(layer.tileDefinition)
      this.objectKeyReplace(tileDefinition, '{libraryId}', selectedEdgeLibrary.identifier)
      this.objectKeyReplace(tileDefinition, '{transform}', pointTransform)

      oldMapLayers[mapLayerKey] = {
        tileDefinitions: [tileDefinition],
        renderMode: 'PRIMITIVE_FEATURES',
        selectable: true,
        drawingOptions: {
          strokeStyle: layer.style_options.normal.strokeColor,
          lineWidth: layer.style_options.normal.strokeWeight
        },
        highlightStyle: {
          lineWidth: layer.style_options.highlight.strokeWeight,
          strokeStyle: layer.style_options.highlight.strokeColor
        },
        fillStyle: "transparent",
        zIndex: 4500, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
        opacity: 0.7
      }
      this.createdMapLayerKeys.add(mapLayerKey)
    })
  }

  // "oldMapLayers" now contains the new layers. Set it in the state
  this.state.mapLayers.next(oldMapLayers)
}

  // mapStateToThis(reduxState) {
  //   return {
  //     constructionLayers: getConstructionLayersList(reduxState)
  //   }
  // }

  // mapDispatchToTarget(dispatch) {
  //   return {
  //     updateLayerVisibility: (layer, isVisible) => {
  //       // First set the visibility of the current layer
  //       dispatch(MapLayerActions.setLayerVisibility(layer, isVisible))
  //     }
  //   }
  // }

  // mergeToTarget(nextState, actions) {
  //   const currentConstructionLayers = this.constructionLayers
    
  //   // merge state and actions onto controller
  //   Object.assign(this, nextState);
  //   Object.assign(this, actions);   
    
  //   if (currentConstructionLayers !== nextState.constructionLayers) {
  //     this.updateMapLayers()
  //   }
  // }

  $onDestroy() {
    //this.unsubscribeRedux()
  }
}


ConstructionSitesController.$inject = ['$rootScope', '$ngRedux', 'map_tools', 'state']

let constructionSites = {
  templateUrl: '/components/views/construction-sites.html',
  bindings: {},
  controller: ConstructionSitesController
}

export default constructionSites