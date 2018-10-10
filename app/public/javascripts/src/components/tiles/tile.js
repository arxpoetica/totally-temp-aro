/**
 * Directive to load map data in the form of tiles
 */
'use strict'

import MapTileRenderer from './map-tile-renderer'
import TileUtilities from './tile-utilities'
import MapUtilities from '../common/plan/map-utilities'
import FeatureSelector from './feature-selector'
import Constants from '../common/constants'

class TileComponentController {

  // MapLayer objects contain the following information
  // id: A globally (within an instance of the application) unique identifier for this layer
  // dataUrls: One or more URLs where we will get the data from. The URL will contain everything except the tile coordinates (zoom/x/y)
  // renderMode: One of the following values:
  //             PRIMITIVE_FEATURES: Renders features using icons, lines or polygons
  //             HEATMAP: Renders features using a heatmap
  //             AGGREGATE_OPACITY: Renders aggregated features with varying opacity based on the aggregated values. Valid only when aggregateMode===BY_ID
  //             AGGREGATE_GRADIENT: Renders aggregated features with varying colors (from a gradient) based on the aggregated values. Valid only when aggregateMode===BY_ID. Think of this as the same as AGGREATE_OPACITY, but instead of opacity from 0.0 to 1.0, the colors change from (for example) red to green
  // iconUrls: (Optional) Urls for icons used to display point data (e.g. Small Businesses)
  // singleIcon: (Optional, default true) If true, then we will use one single icon for rendering all point features in the layer. If false, we will render icons based on certain feature properties
  // iconSwitchFunction: (Optional) A function that will be called by the rendering code (if “singleIcon” is false) for each point feature. The function should return the URL of the icon used for rendering the point. The returned URL must be part of the iconUrls field
  // selectable: (Optional, default false) Set true if you want features in this layer to be selectable
  // aggregateMode: (Optional) One of the following strings:
  //                NONE: Do not perform aggregation
  //                FLATTEN: Flatten all features into a single layer before rendering
  //                BY_ID: Perform aggregation by feature ID. More properties have to be set for this to work
  // aggregateById: (Optional) If aggregateMode===BY_ID, then this gives the feature property by which we want to aggregate. E.g. for census block features, we may have the “gid” property
  // aggregateProperty: (Optional) If aggregateMode===BY_ID, then this gives us the feature property that we want to aggregate. E.g. for census block features, we may want to aggregate by “download_speed”
  // aggregateMinPalette: (Optional) if aggregateMode===BY_ID, then any value below this is rendered with the same color
  // aggregateMaxPalette: (Optional) if aggregateMode===BY_ID, then any value above this is rendered with the same color
  // lineWidth: (Optional) For line and polygon features, this is the width of the line
  // strokeStyle: (Optional) For line and polygon features, this is the color of the line (e.g. ‘#f0a033’)
  // fillStyle: (Optional) For polygon features, this is the fill color
  // opacity: (Optional, default 1.0) This is the maximum opacity of anything drawn on the map layer. Aggregate layers will have features of varying opacity, but none exceeding this value

  constructor($document, state, tileDataService, uiNotificationService) {

    this.layerIdToMapTilesIndex = {}
    this.mapRef = null  // Will be set in $document.ready()
    this.state = state
    this.uiNotificationService = uiNotificationService
    this.tileDataService = tileDataService
    this.areControlsEnabled = true

    // Subscribe to changes in the mapLayers subject
    state.mapLayers
      .debounceTime(100)
      .pairwise() // This will give us the previous value in addition to the current value
      .subscribe((pairs) => this.handleMapEvents(pairs[0], pairs[1], null))

    // Subscribe to changes in the plan (for setting center and zoom)
    state.plan.subscribe((plan) => {
      // Set default coordinates in case we dont have a valid plan
      var coordinates = state.defaultPlanCoordinates
      if (plan) {
        coordinates = {
          zoom: plan.zoomIndex,
          latitude: plan.latitude,
          longitude: plan.longitude
        }
      }

      if (plan) {
        this.areControlsEnabled = (plan.planState === 'START_STATE') || (plan.planState === 'INITIALIZED')
      }
    })

    // Subscribe to events for creating and destroying the map overlay layer
    this.createMapOverlaySubscription = state.requestCreateMapOverlay.skip(1).subscribe(() => this.createMapOverlay())
    this.destroyMapOverlaySubscription = state.requestDestroyMapOverlay.skip(1).subscribe(() => this.destoryMapOverlay())

    // Subscribe to changes in the map tile options
    state.mapTileOptions.subscribe((mapTileOptions) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapTileOptions(mapTileOptions)
      }
    })

    // Redraw map tiles when requestd
    state.requestMapLayerRefresh.subscribe((tilesToRefresh) => {
      this.tileDataService.markHtmlCacheDirty(tilesToRefresh)
      this.refreshMapTiles(tilesToRefresh)
    })
    
    // ToDo: It would seem the repeat code below could be generalized 
    
    // If selected location ids change, set that in the tile data service
    state.selectedLocations.subscribe((selectedLocations) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedLocations(selectedLocations)
      }
    })

    // If selected service_area ids change, set that in the tile data service
    state.selectedServiceAreas.subscribe((selectedServiceAreas) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedServiceAreas(selectedServiceAreas)
      }
    })

    // If selected SA in viewmode change, set that in the tile data service
    state.selectedServiceArea.subscribe((selectedServiceArea) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedServiceArea(selectedServiceArea)
      }
    })

    // If selected Analysis Area in viewmode change, set that in the tile data service
    state.selectedAnalysisArea.subscribe((selectedAnalysisArea) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedAnalysisArea(selectedAnalysisArea)
      }
    })
    
    // If selected census block ids change, set that in the tile data road
    state.selectedCensusBlockId.subscribe((selectedCensusBlockId) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedCensusBlockId(selectedCensusBlockId)
      }
    })
    
    // If selected census category ids change, set that in the tile data road
    state.selectedCensusCategoryId.subscribe((selectedCensusCategoryId) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedCensusCategoryId(selectedCensusCategoryId)
      }
    })
    
    // If selected census category map changes or gets loaded, set that in the tile data road
    state.censusCategories.subscribe((censusCategories) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setCensusCategories(censusCategories)
      }
    })
    
    state.selectedViewFeaturesByType.subscribe((selectedViewFeaturesByType) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedViewFeaturesByType(selectedViewFeaturesByType)
      }
    })
    
    
    // If selected road_segment ids change, set that in the tile data road
    state.selectedRoadSegments.subscribe((selectedRoadSegment) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedRoadSegment(selectedRoadSegment)
      }
    })

    // If Display Mode change, set that in the tile data
    state.selectedDisplayMode.subscribe((selectedDisplayMode) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedDisplayMode(selectedDisplayMode)
      }
    })
    
    // If analysis selection Type change, set that in the tile data
    state.selectionTypeChanged.subscribe((analysisSelectionMode) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setAnalysisSelectionMode(analysisSelectionMode)
      }
    })

    // Set the map zoom level
    state.requestSetMapZoom.subscribe((zoom) => {
      if (this.mapRef) {
        this.mapRef.setZoom(zoom)
      }
    })

    // To change the center of the map to given LatLng 
    state.requestSetMapCenter.subscribe((mapCenter) => {
      if (this.mapRef) {
        this.mapRef.panTo({ lat: mapCenter.latitude, lng: mapCenter.longitude })
      }
    })

    tileDataService.addEntityImageForLayer('SELECTED_LOCATION', state.selectedLocationIcon)

    this.DELTA = Object.freeze({
      IGNORE: 0,
      DELETE: 1,
      UPDATE: 2
    })

    this.state.requestPolygonSelect.subscribe((args) => {
      //console.log(args)
      if (!this.mapRef || !args.coords) {
        return
      }
      
      var mapBounds = this.mapRef.getBounds()
      var neCorner = mapBounds.getNorthEast()
      var swCorner = mapBounds.getSouthWest()
      var zoom = this.mapRef.getZoom()
      // Note the swap from NE/SW to NW/SE when finding tile coordinates
      var tileCoordsNW = MapUtilities.getTileCoordinates(zoom, neCorner.lat(), swCorner.lng())
      var tileCoordsSE = MapUtilities.getTileCoordinates(zoom, swCorner.lat(), neCorner.lng())

      // Loop through all visible tiles
      var pointInPolyPromises = []
      for (var xTile = tileCoordsNW.x; xTile <= tileCoordsSE.x; ++xTile) {
        for (var yTile = tileCoordsNW.y; yTile <= tileCoordsSE.y; ++yTile) {

          // Convert lat lng coordinates into pixel coordinates relative to this tile
          var tileCoords = { x: xTile, y: yTile }
          var convertedPixelCoords = []
          args.coords.forEach((latLng) => {
            var lat, lng
            
            if (latLng.hasOwnProperty('lat')){
              lat = latLng.lat()
              lng = latLng.lng()
            }else{
              lat = latLng[1]
              lng = latLng[0]
            }
            var pixelCoords = MapUtilities.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)
            convertedPixelCoords.push([pixelCoords.x, pixelCoords.y])
          })

          // Get the locations from this tile that are in the polygon
          pointInPolyPromises.push(FeatureSelector.getPointsInPolygon(tileDataService, { width: Constants.TILE_SIZE, height: Constants.TILE_SIZE },
                                                                      this.state.mapLayers.getValue(),
                                                                      zoom, tileCoords.x, tileCoords.y, convertedPixelCoords,
                                                                      this.state.selectedBoundaryType.id))
        }
      }
      Promise.all(pointInPolyPromises) 
        .then((results) => {
          var selectedLocations = new Set()
          var selectedServiceAreas = new Set()
          var selectedRoadSegments = new Set()
          results.forEach((result) => {
            result.forEach((selectedObj) => {
              if (selectedObj.location_id) {
                selectedLocations.add(selectedObj.location_id)
              } else if("service_layer" == selectedObj._data_type && selectedObj.id) {
                selectedServiceAreas.add(selectedObj.id)
              } else if (selectedObj.gid) {
                selectedRoadSegments.add(selectedObj);
              }
            })
          })
          
          var selectedLocationsIds = []
          var selectedServiceAreaIds = []
          
          
          // ToDo: need to combine this with the overlayClickListener below
          var canSelectLoc = true
          var canSelectSA = true
          if (this.state.selectedDisplayMode.getValue() === this.state.displayModes.ANALYSIS){
            if (this.state.optimizationOptions.analysisSelectionMode != this.state.selectionModes.SELECTED_LOCATIONS){
              canSelectLoc = false
            }
            if (this.state.optimizationOptions.analysisSelectionMode != this.state.selectionModes.SELECTED_AREAS){
              canSelectSA = false
            }
          }
          
          if (canSelectLoc){
            selectedLocations.forEach((id) => selectedLocationsIds.push({ location_id: id }))
          }
          
          if (canSelectSA){
            selectedServiceAreas.forEach((id) => selectedServiceAreaIds.push({ id: id }))
          }
          
          state.hackRaiseEvent(selectedLocationsIds)

          //Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
          //console.log(selectedLocationsIds)
          //console.log(selectedServiceAreaIds)
          state.mapFeaturesSelectedEvent.next({
            locations: selectedLocationsIds,
            serviceAreas: selectedServiceAreaIds,
            roadSegments: selectedRoadSegments,
            area: processArea()
          })

          function processArea() {
            //console.log(google.maps)
            return google.maps.geometry.spherical.computeArea(new google.maps.Polygon({paths:args.coords.map((a)=>{
              if (a.hasOwnProperty('lat')){
                return {lat: a.lat() , lng: a.lng()} 
              }else{
                return {lat: a[1] , lng: a[0]} 
              }
            })}).getPath())
          }
        })
        .catch((err) => console.error(err))
    })

    $document.ready(() => {
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]
      this.createMapOverlay()
    })
  }

  // Creates the map overlay that will be used to display vector tile information
  createMapOverlay() {
    if (this.mapRef.overlayMapTypes.length > 0) {
      console.error('ERROR: Creating a map overlay, but we already have overlays defined')
      console.error(this.mapRef.overlayMapTypes)
      return
    }
    this.mapRef.overlayMapTypes.push(new MapTileRenderer(new google.maps.Size(Constants.TILE_SIZE, Constants.TILE_SIZE), 
                                                         this.tileDataService,
                                                         this.state.mapTileOptions.getValue(),
                                                         this.state.selectedLocations.getValue(),
                                                         this.state.selectedServiceAreas.getValue(),
                                                         this.state.selectedAnalysisArea.getValue(),
                                                         this.state.selectedCensusBlockId.getValue(),
                                                         this.state.censusCategories.getValue(),
                                                         this.state.selectedCensusCategoryId.getValue(),
                                                         this.state.selectedRoadSegments.getValue(),
                                                         this.state.selectedViewFeaturesByType.getValue(),
                                                         this.state.selectedDisplayMode.getValue(),
                                                         this.state.optimizationOptions.analysisSelectionMode,
                                                         this.state.displayModes,
                                                         this.state.viewModePanels, 
                                                         this.state, 
                                                         this.uiNotificationService, 
                                                         MapUtilities.getPixelCoordinatesWithinTile.bind(this)
                                                        ))
    this.OVERLAY_MAP_INDEX = this.mapRef.overlayMapTypes.getLength() - 1

    this.overlayClickListener = this.mapRef.addListener('click', (event) => {

      // Get latitiude and longitude
      var lat = event.latLng.lat()
      var lng = event.latLng.lng()

      // Get zoom
      var zoom = this.mapRef.getZoom()
      // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
      var tileCoords = MapUtilities.getTileCoordinates(zoom, lat, lng)

      // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
      var clickedPointPixels = MapUtilities.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)
      FeatureSelector.performHitDetection(this.tileDataService, { width: Constants.TILE_SIZE, height: Constants.TILE_SIZE },
                                          this.state.mapLayers.getValue(), zoom, tileCoords.x, tileCoords.y,
                                          clickedPointPixels.x, clickedPointPixels.y, this.state.selectedBoundaryType.id)
      .then((results) => {
        //console.log('map click')
        //console.log(results)
        var locationFeatures = []
        var analysisAreaFeatures = []
        var serviceAreaFeatures = []
        var roadSegments = new Set()
        var equipmentFeatures = []
        var censusFeatures = []
        
        var canSelectLoc  = false
        var canSelectSA   = false
        
        if(this.state.selectedDisplayMode.getValue() === this.state.displayModes.ANALYSIS) {
          switch (this.state.optimizationOptions.analysisSelectionMode) {
            case this.state.selectionModes.SELECTED_AREAS:
              canSelectSA = !canSelectSA
              break
            case this.state.selectionModes.SELECTED_LOCATIONS:
              canSelectLoc = !canSelectLoc
              break
          }
          if (this.state.areaSelectionMode == this.state.areaSelectionModes.GROUP) canSelectSA = false
        } else if (this.state.selectedDisplayMode.getValue() === this.state.displayModes.VIEW) {
          canSelectSA = true
        }  

        results.forEach((result) => {
          //console.log(result)
          // ToDo: need a better way to differentiate feature types. An explicit way like featureType, also we can then generalize these feature arrays
          // ToDo: filter out deleted etc 
          if(result.location_id && (canSelectLoc || 
              this.state.selectedDisplayMode.getValue() === this.state.displayModes.VIEW)) {
            locationFeatures = locationFeatures.concat(result)
          } else if ( result.hasOwnProperty('_data_type') && 
            result.code && 'analysis_area' === result._data_type ) {
            analysisAreaFeatures.push(result)
          } else if (result.code && canSelectSA) {
            serviceAreaFeatures = serviceAreaFeatures.concat(result)
          } else if (result.gid) {
            roadSegments.add(result)
          } else if ( result.hasOwnProperty('layerType') 
                      && 'census_block' == result.layerType
                      && this.state.selectedDisplayMode.getValue() === this.state.displayModes.VIEW){
              censusFeatures.push(result)
          } else if (result.id && (result._data_type.indexOf('equipment') >= 0)) {
            equipmentFeatures = equipmentFeatures.concat(result)
          }
        })
        
        var hitFeatures = { 
          latLng: event.latLng,
          locations: locationFeatures,
          serviceAreas: serviceAreaFeatures,
          analysisAreas: analysisAreaFeatures,
          roadSegments: roadSegments,
          equipmentFeatures: equipmentFeatures, 
          censusFeatures: censusFeatures
        }
        
        //console.log(hitFeatures)
        
        if (locationFeatures.length > 0) {
          this.state.hackRaiseEvent(locationFeatures)
        }
        
        //Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
        // ToDo: now that we have types these categories should to be dynamic
        this.state.mapFeaturesSelectedEvent.next(hitFeatures)
      })
      .catch((err) => console.error(err))
    })
    
  }

  // Removes the existing map overlay
  destoryMapOverlay() {
    if (this.overlayClickListener) {
      google.maps.event.removeListener(this.overlayClickListener)
      this.overlayClickListener = null
    }

    this.mapRef.overlayMapTypes.clear()
  }

  // Refresh map tiles
  refreshMapTiles(tilesToRefresh) {
    if (!this.mapRef || !this.mapRef.getBounds()) {
      return
    }

    if (tilesToRefresh) {
      // First, redraw the tiles that are outside the viewport AND at the current zoom level.
      this.mapRef.overlayMapTypes.forEach((overlayMap) => {
        overlayMap.redrawCachedTiles(tilesToRefresh)
      })
      return
    }

    // // First get a list of tiles that are visible on the screen.
    var visibleTiles = []
    var zoom = this.mapRef.getZoom()
    visibleTiles = MapUtilities.getVisibleTiles(this.mapRef)

    // Redraw the non-visible tiles. If we don't do this, these tiles will have stale data if the user pans/zooms.
    var redrawnTiles = new Set()
    visibleTiles.forEach((visibleTile) => redrawnTiles.add(TileUtilities.getTileId(visibleTile.zoom, visibleTile.x, visibleTile.y)))
   
    var tilesOutOfViewport = []
    Object.keys(this.tileDataService.tileHtmlCache).forEach((tileKey) => {
      var cachedTile = this.tileDataService.tileHtmlCache[tileKey]
      if (cachedTile.zoom !== zoom) {
        // For all tiles that are not at the current zoom level, simply mark them as dirty. When you change the zoom
        // level, Google maps will call getTile() and we will be able to redraw the tiles
        cachedTile.isDirty = true
      } else {
        // For all tiles at the current zoom level, we must redraw them. This is because Google maps does not call
        // getTile() when the user pans. In this case, the tiles will show stale data if they are not redrawn.
        const isTileVisible = redrawnTiles.has(TileUtilities.getTileId(cachedTile.zoom, cachedTile.coord.x, cachedTile.coord.y))
        if (!isTileVisible) {
          tilesOutOfViewport.push({ zoom: cachedTile.zoom, x: cachedTile.coord.x, y: cachedTile.coord.y })
        }
      }
    })
    // First, redraw the tiles that are outside the viewport AND at the current zoom level.
    this.mapRef.overlayMapTypes.forEach((overlayMap) => {
      overlayMap.redrawCachedTiles(tilesOutOfViewport)
    })
    // Next, redraw the visible tiles. We do it this way because tiles that are redrawn most recently are given a higher priority.
    this.mapRef.overlayMapTypes.forEach((overlayMap) => {
      overlayMap.redrawCachedTiles(visibleTiles)
    })
  }

  // Handles map layer events
  handleMapEvents(oldMapLayers, newMapLayers, mapLayerActions) {
    if (!this.mapRef || this.mapRef.overlayMapTypes.getLength() <= this.OVERLAY_MAP_INDEX) {
      // Map not initialized yet
      return
    }

    this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapLayers(newMapLayers)
    this.refreshMapTiles()
  }

  $onInit() {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }
  }

  $onDestroy() {
    this.createMapOverlaySubscription()
    this.destroyMapOverlaySubscription()    
  }
}

TileComponentController.$inject = ['$document', 'state', 'tileDataService', 'uiNotificationService']

let tile = {
  template: '',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: TileComponentController
}

export default tile