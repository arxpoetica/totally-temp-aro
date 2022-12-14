/**
 * Directive to load map data in the form of tiles
 */
'use strict'

import MapTileRenderer from './map-tile-renderer'
import TileUtilities from './tile-utilities'
import MapUtilities from '../common/plan/map-utilities'
import FeatureSelector from './feature-selector'
import Constants from '../common/constants'
import rConstants from '../../react/common/constants'
import SelectionModes from '../../react/components/selection/selection-modes'
import MenuAction, { MenuActionTypes } from '../common/context-menu/menu-action'
import MenuItem from '../common/context-menu/menu-item'
import ToolBarActions from '../../react/components/header/tool-bar-actions'
import PlanEditorActions from '../../react/components/plan-editor/plan-editor-actions'
import PlanEditorSelectors from '../../react/components/plan-editor/plan-editor-selectors'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'
import WktUtils from '../../shared-utils/wkt-utils'
import { dequal } from 'dequal'

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
  // iconSwitchFunction: (Optional) A function that will be called by the rendering code (if ???singleIcon??? is false) for each point feature. The function should return the URL of the icon used for rendering the point. The returned URL must be part of the iconUrls field
  // selectable: (Optional, default false) Set true if you want features in this layer to be selectable
  // aggregateMode: (Optional) One of the following strings:
  //                NONE: Do not perform aggregation
  //                FLATTEN: Flatten all features into a single layer before rendering
  //                BY_ID: Perform aggregation by feature ID. More properties have to be set for this to work
  // aggregateById: (Optional) If aggregateMode===BY_ID, then this gives the feature property by which we want to aggregate. E.g. for census block features, we may have the ???gid??? property
  // aggregateProperty: (Optional) If aggregateMode===BY_ID, then this gives us the feature property that we want to aggregate. E.g. for census block features, we may want to aggregate by ???download_speed???
  // aggregateMinPalette: (Optional) if aggregateMode===BY_ID, then any value below this is rendered with the same color
  // aggregateMaxPalette: (Optional) if aggregateMode===BY_ID, then any value above this is rendered with the same color
  // lineWidth: (Optional) For line and polygon features, this is the width of the line
  // strokeStyle: (Optional) For line and polygon features, this is the color of the line (e.g. ???#f0a033???)
  // fillStyle: (Optional) For polygon features, this is the fill color
  // opacity: (Optional, default 1.0) This is the maximum opacity of anything drawn on the map layer. Aggregate layers will have features of varying opacity, but none exceeding this value

  constructor ($window, $document, $timeout, $ngRedux, state, tileDataService, contextMenuService, Utils, $scope, rxState) {
    this.layerIdToMapTilesIndex = {}
    this.mapRef = null // Will be set in $document.ready()
    this.$window = $window
    this.$timeout = $timeout
    this.$ngRedux = $ngRedux
    this.state = state
    this.tileDataService = tileDataService
    this.contextMenuService = contextMenuService
    this.utils = Utils
    this.rxState = rxState

    // Subscribe to events for creating and destroying the map overlay layer
    this.createMapOverlaySubscription = state.requestCreateMapOverlay.skip(1).subscribe(() => this.createMapOverlay())
    this.destroyMapOverlaySubscription = state.requestDestroyMapOverlay.skip(1).subscribe(() => this.destroyMapOverlay())

    tileDataService.addEntityImageForLayer('SELECTED_LOCATION', state.selectedLocationIcon)

    this.DELTA = Object.freeze({
      IGNORE: 0,
      DELETE: 1,
      UPDATE: 2
    })

    $document.ready(() => {
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]
      this.createMapOverlay()
      this.unsubscribeRedux = this.$ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
    })
  }


  // this registers to old VTL subscribers, events, and so forth
  // see `rootUnsubscribeAll` for unsubscribers
  rootSubscribeAll () {
    let state = this.state
    let rxState = this.rxState
    // Subscribe to changes in the mapLayers subject
    this.unsubMapLayers = state.mapLayers
      .debounceTime(100)
      .pairwise() // This will give us the previous value in addition to the current value
      .subscribe((pairs) => this.handleMapEvents(pairs[0], pairs[1], null))

    // Subscribe to changes in the plan (for setting center and zoom)
    this.unsubPlanChanged = state.planChanged.subscribe(() => {
      // Set default coordinates in case we dont have a valid plan
      var coordinates = state.defaultPlanCoordinates
      if (state.plan) {
        coordinates = {
          zoom: state.plan.zoomIndex,
          latitude: state.plan.latitude,
          longitude: state.plan.longitude
        }
      }
    })

    // Subscribe to changes in the map tile options
    this.unsubMapTileOptions = rxState.mapTileOptions.getMessage().subscribe((mapTileOptions) => {
      this.mapTileOptions = JSON.parse(JSON.stringify(mapTileOptions))
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapTileOptions(mapTileOptions)
      }
    })

    this.unsubRXMapLayerRefresh = rxState.requestMapLayerRefresh.getMessage().subscribe((tilesToRefresh) => {
      this.tileDataService.markHtmlCacheDirty(tilesToRefresh)
      this.refreshMapTiles(tilesToRefresh)
    });

    // Redraw map tiles when requestd
    this.unsubMapLayerRefresh = state.requestMapLayerRefresh.subscribe((tilesToRefresh) => {
      this.tileDataService.markHtmlCacheDirty(tilesToRefresh)
      this.refreshMapTiles(tilesToRefresh)
    })

    // If selected layer category map changes or gets loaded, set that in the tile data road
    this.unsubCategories = state.layerCategories.subscribe((layerCategories) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setLayerCategories(layerCategories)
      }
    })

    // If Display Mode change, set that in the tile data
    this.unsubDisplayMode = state.selectedDisplayMode.subscribe((selectedDisplayMode) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedDisplayMode(selectedDisplayMode)
      }
    })

    // To change the center of the map to given LatLng
    this.unsubSetMapCenter = state.requestSetMapCenter.skip(1).subscribe(mapCenter => {
      if (this.mapRef) {
        this.mapRef.panTo({ lat: mapCenter.latitude, lng: mapCenter.longitude })
      }
    })
    
    // Set the map zoom level
    this.unsubRXSetMapZoom = rxState.requestSetMapZoom.getMessage().skip(1).subscribe((zoom) => {
      if (this.mapRef) {
        this.mapRef.setZoom(zoom)
      }
    })

    // Set the map zoom level
    this.unsubSetMapZoom = state.requestSetMapZoom.skip(1).subscribe((zoom) => {
      if (this.mapRef) {
        this.mapRef.setZoom(zoom)
      }
    })
    
    //Due to unable to subscribe requestSetMapCenter as of now used Custom Event Listener
    // https://www.sitepoint.com/javascript-custom-events/
    
    this.onMapChanged = (mapCenter) => { 
      if (this.mapRef) {
        this.mapRef.panTo({ lat: mapCenter.detail.latitude, lng: mapCenter.detail.longitude })
        this.mapRef.setZoom(mapCenter.detail.zoom)
      }
    }
    window.addEventListener('mapChanged', this.onMapChanged)

    this.unsubPolygonSelect = this.state.requestPolygonSelect.subscribe((args) => {
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

            if (latLng.hasOwnProperty('lat')) {
              lat = latLng.lat()
              lng = latLng.lng()
            } else {
              lat = latLng[1]
              lng = latLng[0]
            }
            var pixelCoords = MapUtilities.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)
            convertedPixelCoords.push([pixelCoords.x, pixelCoords.y])
          })

          // Get the locations from this tile that are in the polygon
          pointInPolyPromises.push(FeatureSelector.getPointsInPolygon(this.tileDataService, { width: Constants.TILE_SIZE, height: Constants.TILE_SIZE },
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
              if (selectedObj._data_type === 'location') {
                selectedLocations.add(selectedObj)
              } else if (selectedObj._data_type == 'service_layer' && selectedObj.id) {
                selectedServiceAreas.add(selectedObj.id)
              } else if (selectedObj.gid) {
                selectedRoadSegments.add(selectedObj)
              }
            })
          })

          var selectedLocationsIds = []
          var selectedServiceAreaIds = []

          // ToDo: need to combine this with the overlayClickListener below
          var canSelectLoc = true
          var canSelectSA = true
          if (this.state.selectedDisplayMode.getValue() === this.state.displayModes.ANALYSIS || this.rSelectedDisplayMode === this.state.displayModes.ANALYSIS) {
            if (this.activeSelectionModeId != SelectionModes.SELECTED_LOCATIONS) {
              canSelectLoc = false
            }
            if (this.activeSelectionModeId != SelectionModes.SELECTED_AREAS) {
              canSelectSA = false
            }
            if (this.networkAnalysisType === 'RFP') {
              canSelectLoc = canSelectSA = false // Do not allow any selection for RFP mode
            }
          }

          if (canSelectLoc) {
            selectedLocationsIds = selectedLocations
          }

          if (canSelectSA) {
            selectedServiceAreas.forEach((id) => selectedServiceAreaIds.push({ id: id }))
          }

          // Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
          state.mapFeaturesSelectedEvent.next({
            locations: selectedLocationsIds,
            serviceAreas: selectedServiceAreaIds,
            roadSegments: selectedRoadSegments,
            area: processArea()
          })

          function processArea () {
            return google.maps.geometry.spherical.computeArea(new google.maps.Polygon({ paths: args.coords.map((a) => {
              if (a.hasOwnProperty('lat')) {
                return { lat: a.lat(), lng: a.lng() }
              } else {
                return { lat: a[1], lng: a[0] }
              }
            }) }).getPath())
          }
        })
        .catch((err) => console.error(err))
    })
  }

  // this unregisters old VTL subscribers, events, and so forth
  // see `rootSubscribeAll` for subscribers
  rootUnsubscribeAll () {
    //this.unsubscribeRedux()
    this.unsubPolygonSelect.unsubscribe()
    window.removeEventListener('mapChanged', this.onMapChanged)
    //this.unsubRXSetMapCenter.unsubscribe()
    this.unsubSetMapCenter.unsubscribe()
    this.unsubRXSetMapZoom.unsubscribe()
    this.unsubSetMapZoom.unsubscribe()
    this.unsubDisplayMode.unsubscribe()
    this.unsubCategories.unsubscribe()
    this.unsubRXMapLayerRefresh.unsubscribe()
    this.unsubMapLayerRefresh.unsubscribe()
    this.unsubMapTileOptions.unsubscribe()
    this.unsubPlanChanged.unsubscribe()
    this.unsubMapLayers.unsubscribe()
  }


  // Creates the map overlay that will be used to display vector tile information
  // ToDo: stateMapLayers doesn't seem to get updated in MapTileRenderer when it changes in Redux
  createMapOverlay () {
    this.rootSubscribeAll()

    if (this.mapRef.overlayMapTypes.length > 0) {
      console.error('ERROR: Creating a map overlay, but we already have overlays defined')
      console.error(this.mapRef.overlayMapTypes)
      return
    }

    this.mapRef.overlayMapTypes.push(new MapTileRenderer(new google.maps.Size(Constants.TILE_SIZE, Constants.TILE_SIZE),
      this.tileDataService,
      this.mapTileOptions,
      this.state.layerCategories.getValue(),
      this.state.selectedDisplayMode.getValue(),
      SelectionModes,
      this.activeSelectionModeId,
      this.stateMapLayers,
      this.state.displayModes,
      this.state.viewModePanels,
      this.state,
      MapUtilities.getPixelCoordinatesWithinTile.bind(this),
      this.selectedSubnetLocations,
      this.locationAlerts,
      this.rShowFiberSize,
      this.rViewSetting,
      this.selectionIds
    ))
    this.OVERLAY_MAP_INDEX = this.mapRef.overlayMapTypes.getLength() - 1
    //this.state.isShiftPressed = false // make this per-overlay or move it somewhere more global
    
    // Update the selection in the renderer. We should have a bound "this.oldSelection" at this point
    if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
      this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setOldSelection(this.state && this.state.selection)
      this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelection(this.selection)
    }
    
    // listener for shift key
    this.keydownListener = this.$window.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') this.state.isShiftPressed = true
    })
    
    this.keyupListener = this.$window.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') this.state.isShiftPressed = false
    })
    
    this.overlayRightclickListener = this.mapRef.addListener('rightclick', (event) => {
      this.getFeaturesUnderLatLng(event.latLng)
      .then((hitFeatures) => {
        hitFeatures.event = event
        this.state.mapFeaturesRightClickedEvent.next(hitFeatures)
      })

      if (this.rSelectedDisplayMode !== this.state.displayModes.VIEW
        || this.rActiveViewModePanel === this.state.viewModePanels.EDIT_SERVICE_LAYER
      ) return

      this.getFilteredFeaturesUnderLatLng(event.latLng)
        .then((hitFeatures) => {
          var menuItems = []
          var menuItemsById = {}

          // ToDo: this should be formalised
          var featureCats = [
            'locations',
            'serviceAreas',
            'analysisAreas',
            'roadSegments',
            'equipmentFeatures',
            'censusFeatures'
          ]

          var bounds = []
          var boundsByNetworkNodeObjectId = {}
          featureCats.forEach((cat) => {
            hitFeatures[cat].forEach((feature) => {
              var menuItemFeatureId = null

              if (feature.hasOwnProperty('object_id')) {
                menuItemFeatureId = feature.objectId = feature.object_id
              } else if (feature.hasOwnProperty('objectId')) {
                menuItemFeatureId = feature.objectId
              } else if (feature._data_type === 'location') {
                menuItemFeatureId = feature.location_id
              } else if (feature._data_type === 'census_block') {
                menuItemFeatureId = `census_block_${feature.id}`
              }

              // if ( feature.hasOwnProperty('objectId') && !menuItemsById.hasOwnProperty(feature.objectId) ){
              if (menuItemFeatureId && !menuItemsById.menuItemFeatureId) {
              // ToDo: formalize this
                var singleHitFeature = {}
                singleHitFeature.latLng = hitFeatures.latLng
                singleHitFeature[cat] = [feature]

                var options = []
                options.push(new MenuAction(MenuActionTypes.SELECT, () => this.state.mapFeaturesSelectedEvent.next(singleHitFeature)))

                const menuItemType = this.utils.getFeatureMenuItemType(feature)
                var name = this.utils.getFeatureDisplayName(feature, this.state)
                var menuItem = new MenuItem(menuItemType, name, options)
                menuItems.push(menuItem)
                menuItemsById[menuItemFeatureId] = menuItem
                if (feature.hasOwnProperty('network_node_object_id')) {
                  bounds.push(feature)
                  boundsByNetworkNodeObjectId[feature.network_node_object_id] = menuItem
                }
              }
            })
          })

          if (menuItems.length > 0) {
            this.utils.getBoundsCLLIs(bounds, this.state)
              .then((results) => {
                results.forEach(result => {
                  const clliCode = (result.data.networkNodeEquipment.siteInfo.siteClli) || '(empty CLLI code)'
                  boundsByNetworkNodeObjectId[result.data.objectId].displayName = `Boundary: ${clliCode}`
                })

                var eventXY = WktUtils.getXYFromEvent(event)
                this.contextMenuService.populateMenu(menuItems)
                this.contextMenuService.moveMenu(eventXY.x, eventXY.y)
                this.contextMenuService.menuOn()
                this.$timeout()
              })
          }
        })
    })

    this.overlayDragstartListener = this.mapRef.addListener('dragstart', (event) => {
      if (this.contextMenuService.isMenuVisible.getValue()) {
        this.contextMenuService.menuOff()
        this.$timeout()
      }
    })

    this.overlayClickListener = this.mapRef.addListener('click', async(event) => {
      const displayMode = this.state.selectedDisplayMode.getValue()
      const { ANALYSIS, EDIT_PLAN } = this.state.displayModes
      const { rPlanState } = this
      const { STARTED, COMPLETED } = rConstants.PLAN_STATE

      if (displayMode === ANALYSIS && (rPlanState === STARTED || rPlanState === COMPLETED)) {
        return
      }

      if (this.contextMenuService.isMenuVisible.getValue()) {
        this.contextMenuService.menuOff()
        this.$timeout()
        return
      }

      const { isShiftPressed } = this.state

      // let plan edit do its thing
      if (displayMode === EDIT_PLAN) {
        if (!isShiftPressed) this.leftClickTile(event.latLng)
        return
      }

      try {
        const hitFeatures = await this.getFilteredFeaturesUnderLatLng(event.latLng)
        const hittableSegmentsIds = Object
          .values(this.stateMapLayers.edgeConstructionTypes)
          .filter(type => type.isVisible)
          .map(type => type.id)
        const hitRoadSegments = [...hitFeatures.roadSegments || []].filter(segment => {
          return hittableSegmentsIds.includes(segment.edge_construction_type)
        })

        const hasRoadSegments = hitRoadSegments.length > 0
        if (isShiftPressed && !hasRoadSegments) {
          return
        }

        if (hitFeatures) {
          if (isShiftPressed && hasRoadSegments) {
            const mapFeatures = this.state.mapFeaturesSelectedEvent.getValue()
            const priorRoadSegments = [...mapFeatures.roadSegments || []]

            // capturing difference because shift + click should also remove
            const onlyInPrior = priorRoadSegments.filter(segment => {
              return !hitRoadSegments.find(found => found.id === segment.id)
            })
            const onlyInHit = hitRoadSegments.filter(segment => {
              return !priorRoadSegments.find(found => found.id === segment.id)
            })

            hitFeatures.roadSegments = new Set([...onlyInPrior, ...onlyInHit])
          } else {
            hitFeatures.roadSegments = new Set([...hitRoadSegments])
          }

          // BIG FAT TODO: THIS _SET DIFFERENCE_ REALLY DOESN'T GO HERE.
          // THERE'S A MASSIVE (MASSIVE) CHAIN OF FEATURE SELECTIONS THAT COULD
          // BE SIMPLIFIED INTO A MUCH MORE DISCREET (SINGLE) SELECTION FUNCTION.
          // RIGHT NOW THERE'S 5 OR MORE FUNCTIONS PASSING ALONG THE DATA, BEFORE AND AFTER THIS
          // potential TODO: maybe we can fix it as part of vector tile 2.0
          const prevHitFeatures = this.state.mapFeaturesSelectedEvent.getValue()
          if (Object.keys(prevHitFeatures).length) {
            // unfortunately, because of data inconsistency,
            // this requires special casing. TODO: simplify the data
            // structures for this kind of thing!

            // annoying prep (this is reset below)
            prevHitFeatures.roadSegments = [...(prevHitFeatures.roadSegments || [])]
            prevHitFeatures.fiberFeatures = [...(prevHitFeatures.fiberFeatures || [])]
            hitFeatures.roadSegments = [...(hitFeatures.roadSegments || [])]
            hitFeatures.fiberFeatures = [...(hitFeatures.fiberFeatures || [])]

            // NOTE: not running anything with boundaries because only
            // focused on selection/deselection of point-based features.
            // For a historical explanantion: anything beyond is fairly complicated...
            const featureNamesAndFeatureIdNames = [
              // ['analysisAreas', 'id'],
              // ['censusFeatures', 'id'],
              ['equipmentFeatures', 'object_id'],
              ['fiberFeatures', 'link_id'],
              ['locations', 'object_id'],
              ['roadSegments', 'object_id'],
              // ['serviceAreas', 'object_id'],
            ]
            for (const [featureName, idName] of featureNamesAndFeatureIdNames) {
              // performing a set difference
              // https://www.wikiwand.com/en/Difference_(set_theory)#/Relative_complement
              const prevFeatures = prevHitFeatures[featureName]
              hitFeatures[featureName] = hitFeatures[featureName].filter(feature => {
                // FIXME: OH MY HECK GROSS: `prevFeatures.locations` is SOMETIMES an array
                // and SOMETIMES a Set...WHHHHHUUUUUHHH???? Hence `[...prevFeatures]
                const found = [...prevFeatures].find(prevItem => prevItem[idName] === feature[idName])
                return !found
              })
            }
            // this is so gross, and really exemplifies why we need
            // a single source of truth for a selection model, but...
            // ...if you're selecting anything with a border, it can conflict
            // with single-point-based selections, so need to prioritize those...
            if (
              hitFeatures.equipmentFeatures.length
              || hitFeatures.fiberFeatures.length
              || hitFeatures.locations.length
              || hitFeatures.roadSegments.length
            ) {
              hitFeatures.analysisAreas = []
              hitFeatures.censusFeatures = []
              hitFeatures.serviceAreas = []
            }

            // annoying post-prep reset
            prevHitFeatures.roadSegments = new Set([...prevHitFeatures.roadSegments])
            prevHitFeatures.fiberFeatures = new Set([...prevHitFeatures.fiberFeatures])
            hitFeatures.roadSegments = new Set([...hitFeatures.roadSegments])
            hitFeatures.fiberFeatures = new Set([...hitFeatures.fiberFeatures])
          }

          // Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
          // ToDo: now that we have types these categories should to be dynamic
          this.state.mapFeaturesSelectedEvent.next(hitFeatures)
        }
      } catch (error) {
        console.error(error)
      }
    })

    // FIXME: move this to the plan edit jsx files when loading locations from new API
    this.mousemoveTimer = null
    this.overlayMousemoveListener = this.mapRef.addListener('mousemove', event => {
      // we're only reacting to `mousemove` in plan edit mode
      if (this.state.selectedDisplayMode.getValue() !== this.state.displayModes.EDIT_PLAN) {
        return
      }

      clearTimeout(this.mousemoveTimer)
      this.mousemoveTimer = setTimeout(async() => {
        // FIXME: let's JUST load location information
        // ToDo: 
        // I think that anytime this file dispatches a redux action it causes a rerender
        // We'll be compleetly replacing this system - until then send info through state.js
        const { locations } = await this.getFeaturesUnderLatLng(event.latLng)
        const ids = locations.map(location => location.object_id)
        this.setCursorLocationIds(ids) // hitch to new VTS 
      }, 100)
    })
    this.overlayMouseoutListener = this.mapRef.addListener('mouseout', () => {
      clearTimeout(this.mousemoveTimer)
      this.clearCursorLocationIds()
    })

    this.getFeaturesUnderLatLng = function (latLng) {
      // Get latitiude and longitude
      var lat = latLng.lat()
      var lng = latLng.lng()

      // Get zoom
      var zoom = this.mapRef.getZoom()
      // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
      var tileCoords = MapUtilities.getTileCoordinates(zoom, lat, lng)

      // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
      var clickedPointPixels = MapUtilities.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)
      return FeatureSelector.performHitDetection(this.tileDataService, { width: Constants.TILE_SIZE, height: Constants.TILE_SIZE },
        this.state.mapLayers.getValue(), zoom, tileCoords.x, tileCoords.y,
        clickedPointPixels.x, clickedPointPixels.y, this.state.selectedBoundaryType.id)
        .then((results) => {
          var locations = []
          var analysisAreas = []
          var serviceAreas = []
          var roadSegments = new Set()
          var equipmentFeatures = []
          var censusFeatures = []
          var fiberFeatures = new Set()

          results.forEach((result) => {
            // ToDo: need a better way to differentiate feature types. An explicit way like featureType, also we can then generalize these feature arrays
            // ToDo: filter out deleted etc
            if (result._data_type === 'location') {
              locations = locations.concat(result)
            } else if (result.code && result._data_type === 'analysis_area') {
              analysisAreas.push(result)
            } else if (result.code) {
              serviceAreas = serviceAreas.concat(result)
            } else if (result.id && (result._data_type.indexOf('equipment') >= 0)) {
              equipmentFeatures = equipmentFeatures.concat(result)
            } else if ((result.id || result.link_id) && (result._data_type.indexOf('fiber') >= 0)) {
              // fiberFeatures = fiberFeatures.concat(result)
              fiberFeatures.add(result)
            } else if (result.gid) {
              roadSegments.add(result)
            } else if (result.layerType && result.layerType === 'census_block') {
              censusFeatures.push(result)
            }
          })

          // ToDo: formalize this
          // var hitFeatures = new FeatureSets() // need to import the class BUT it's over in React land, ask Parag
          var hitFeatures = {
            latLng: latLng,
            locations: locations,
            serviceAreas: serviceAreas,
            analysisAreas: analysisAreas,
            roadSegments: roadSegments,
            equipmentFeatures: equipmentFeatures,
            censusFeatures: censusFeatures,
            fiberFeatures: fiberFeatures
          }
          //var hitFeatures = new FeatureSets()
          return hitFeatures
        })
        .catch((err) => {
          console.error(err)
        })
    }
    
    // ToDo: we need to refactor this. Tile should just send out the event that a list of things have been clicked
    // then leave it up to the listeners whether they respond
    this.getFilteredFeaturesUnderLatLng = function (latLng) {
      return this.getFeaturesUnderLatLng(latLng)
        .then((hitFeatures) => {
          var canSelectLoc = false
          var canSelectSA = false
          if (this.state.selectedDisplayMode.getValue() === this.state.displayModes.ANALYSIS || this.rSelectedDisplayMode === this.state.displayModes.ANALYSIS) {
            switch (this.activeSelectionModeId) {
              case SelectionModes.SELECTED_AREAS:
                canSelectSA = !canSelectSA
                break
              case SelectionModes.SELECTED_LOCATIONS:
                canSelectLoc = !canSelectLoc
                break
            }
            if (this.networkAnalysisType === 'RFP') {
              canSelectLoc = canSelectSA = false // Do not allow any selection for RFP mode
            }
          } else if (this.state.selectedDisplayMode.getValue() === this.state.displayModes.VIEW || this.rSelectedDisplayMode === this.state.displayModes.VIEW) {
            canSelectSA = true
          }
          // filter the lists 
          if (!canSelectLoc &&
            (this.state.selectedDisplayMode.getValue() !== this.state.displayModes.VIEW || this.rSelectedDisplayMode !== this.state.displayModes.VIEW)) {
            hitFeatures.locations = []
          }
          if (!canSelectSA) {
            hitFeatures.serviceAreas = []
          }
          if (this.state.selectedDisplayMode.getValue() !== this.state.displayModes.VIEW || this.rSelectedDisplayMode !== this.state.displayModes.VIEW) {
            hitFeatures.censusFeatures = []
          }
          
          return hitFeatures
        })
        .catch((err) => {
          console.error(err)
        })
    }
    // init render tiles
    let mapLayers = this.state.mapLayers.getValue()
    if (Object.keys(mapLayers).length) {
      this.handleMapEvents(null, this.state.mapLayers.getValue(), null)
    }
  }

  // Removes the existing map overlay
  destroyMapOverlay () {
    if (this.overlayClickListener) {
      google.maps.event.removeListener(this.overlayClickListener)
      this.overlayClickListener = null
    }

    // FIXME: move this to the plan edit jsx files when loading locations from new API
    if (this.overlayMouseoutListener) {
      google.maps.event.removeListener(this.overlayMouseoutListener)
      this.overlayMouseoutListener = null
    }
    if (this.overlayMousemoveListener) {
      google.maps.event.removeListener(this.overlayMousemoveListener)
      this.overlayMousemoveListener = null
      this.mousemoveTimer = null
    }

    if (this.overlayRightclickListener) {
      google.maps.event.removeListener(this.overlayRightclickListener)
      this.overlayRightclickListener = null
    }

    if (this.overlayDragstartListener) {
      google.maps.event.removeListener(this.overlayDragstartListener)
      this.overlayDragstartListener = null
    }
    
    if (this.keydownListener) {
      this.$window.removeListener(this.keydownListener)
      this.keydownListener = null
    }
    
    if (this.keyupListener) {
      this.$window.removeListener(this.keyupListener)
      this.keyupListener = null
    }
    
    this.mapRef.overlayMapTypes.clear()
    this.OVERLAY_MAP_INDEX = null

    this.rootUnsubscribeAll()
  }

  // Refresh map tiles
  refreshMapTiles (tilesToRefresh) {
    if (this.state.suppressVectorTiles) {
      console.warn('Suppressing map tile refresh')
      return
    }
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
  handleMapEvents (oldMapLayers, newMapLayers, mapLayerActions) {
    if (!this.mapRef || this.mapRef.overlayMapTypes.getLength() <= this.OVERLAY_MAP_INDEX) {
      // Map not initialized yet
      return
    }
    this.setActiveMapLayers(newMapLayers)
    this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapLayers(newMapLayers)
    this.refreshMapTiles()
  }

  $onInit () {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }
  }

  // $onChanges (changesObj) {
  //   if (changesObj.oldSelection) {
  //     // Update the selection in the renderer
  //     if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
  //       this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setOldSelection(this.oldSelection)
  //       // If the selection has changed, redraw the tiles
  //       this.tileDataService.markHtmlCacheDirty()
  //       this.refreshMapTiles()
  //     }
  //   }
  // }

  $doCheck () {
    if (!this.state) {
      return
    }

    if (this.cachedOldSelection !== this.state.selection) {
      // Update the selection in the renderer
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setOldSelection(this.state.selection)
        // If the selection has changed, redraw the tiles
        this.tileDataService.markHtmlCacheDirty()
        this.refreshMapTiles()
        this.cachedOldSelection = this.state.selection
      }
    }

    // For React boundries-info
    if (this.rCachedOldSelection !== this.rSelection) {
      // Update the selection in the renderer
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setOldSelection(this.rSelection)
        // If the selection has changed, redraw the tiles
        this.tileDataService.markHtmlCacheDirty()
        this.refreshMapTiles()
        this.rCachedOldSelection = this.rSelection
      }
    }
  }

  $onDestroy () {
    this.createMapOverlaySubscription()
    this.destroyMapOverlaySubscription()
    this.destroyMapOverlay()
    this.unsubscribeRedux()
  }

  // Map global state to component properties
  mapStateToThis (reduxState) {
    return {
      activeSelectionModeId: reduxState.selection.activeSelectionMode.id,
      selectionModes: reduxState.selection.selectionModes,
      selection: reduxState.selection,
      rSelection: reduxState.selection.selection,
      stateMapLayers: reduxState.mapLayers,
      networkAnalysisType: reduxState.optimization.networkOptimization.optimizationInputs.analysis_type,
      zoom: reduxState.map.zoom,
      mapCenter: reduxState.map.mapCenter,
      rShowFiberSize: reduxState.toolbar.showFiberSize, // Set to map-tile-render.js from tool-bar.jsx
      rViewSetting: reduxState.toolbar.viewSetting, // Set to map-tile-render.js from aro-debug.jsx
      rSelectedDisplayMode: reduxState.toolbar.rSelectedDisplayMode,
      rActiveViewModePanel: reduxState.toolbar.rActiveViewModePanel,
      subnetFeatures: reduxState.planEditor.subnetFeatures,
      locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(reduxState),
      selectedSubnetLocations: PlanEditorSelectors.getLocationsForSelectedSubnet(reduxState), 
      selectionIds: reduxState.selection.planEditorFeatures,
      polygonCoordinates: reduxState.selection.polygonCoordinates,
      rPlanState: reduxState.plan && reduxState.plan.activePlan && reduxState.plan.activePlan.planState,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      rActiveViewModePanelAction: value => dispatch(ToolBarActions.activeViewModePanel(value)),
      setCursorLocationIds: ids => dispatch(PlanEditorActions.setCursorLocationIds(ids)),
      clearCursorLocationIds: () => dispatch(PlanEditorActions.clearCursorLocationIds()),
      setActiveMapLayers: (value) => dispatch(MapLayerActions.setActiveMapLayers(value)),
      leftClickTile: (latLng) => dispatch(PlanEditorActions.leftClickTile(latLng)),
    }
  }

  mergeToTarget (nextState, actions) {
    if (null === this.OVERLAY_MAP_INDEX) return
    // store the previous values before Object.assign
    const currentSelectionModeId = this.activeSelectionModeId
    const oldPlanTargets = this.selection && this.selection.planTargets
    const prevStateMapLayers = { ...this.stateMapLayers }
    const rShowFiberSize = this.rShowFiberSize
    const rViewSetting = this.rViewSetting
    const selectedSubnetLocations = this.selectedSubnetLocations
    const locationAlerts = this.locationAlerts
    const currentSelectionIds = this.selectionIds
    const currentPolygonCoordinates = this.polygonCoordinates

    var needRefresh = false
    var doConduitUpdate = this.doesConduitNeedUpdate(prevStateMapLayers, nextState.stateMapLayers)
    needRefresh = doConduitUpdate
    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    let overlayMap = this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX)
    
    if (doConduitUpdate) {
      overlayMap.setStateMapLayers(nextState.stateMapLayers)
    }

    if (currentSelectionModeId !== nextState.activeSelectionModeId ||
        this.hasPlanTargetSelectionChanged(oldPlanTargets, nextState.selection && nextState.selection.planTargets)) {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        overlayMap.setAnalysisSelectionMode(nextState.activeSelectionModeId)
        overlayMap.setSelection(nextState.selection)
        needRefresh = true
      }
    }

    // Edit Locations
    if (!dequal(currentSelectionIds, nextState.selectionIds)) {
      overlayMap.setSelectionIds(nextState.selectionIds)
      needRefresh = true
    }

    // - plan edit - //
    if (!dequal(selectedSubnetLocations, nextState.selectedSubnetLocations)) {
      overlayMap.setSelectedSubnetLocations(nextState.selectedSubnetLocations)
      needRefresh = true
    }
    if (!dequal(locationAlerts, nextState.locationAlerts)) {
      overlayMap.setLocationAlerts(nextState.locationAlerts)
      needRefresh = true
    }
    // - //

    // Set the current state in rShowFiberSize
    // If this is not set, the redux state does not change, it shows only the initial state, so current state is set in rShowFiberSize.
    if (rShowFiberSize !== nextState.rShowFiberSize) {
      overlayMap.setReactShowFiberSize(nextState.rShowFiberSize)
      needRefresh = true
    }

    // Set the current state in rViewSetting
    if (rViewSetting !== nextState.rViewSetting) {
      overlayMap.setReactViewSetting(nextState.rViewSetting)
      needRefresh = true
    }

    if (needRefresh) {
      this.tileDataService.markHtmlCacheDirty()
      this.refreshMapTiles()
    }

    // Analysis Mode
    if (currentPolygonCoordinates && !dequal(currentPolygonCoordinates, nextState.polygonCoordinates)) {
      this.state.requestPolygonSelect.next(nextState.polygonCoordinates)
    }
  }

  hasPlanTargetSelectionChanged (oldSelection, newSelection) {
    if (!oldSelection || !newSelection || (oldSelection !== newSelection)) {
      return true
    }
    // A hacky way to perform change detection, because of the way our tile.js and map-tile-renderer.js are set up.
    const strOldSelection = {
      locations: [...oldSelection.locations],
      serviceAreas: [...oldSelection.serviceAreas],
      analysisAreas: [...oldSelection.analysisAreas]
    }

    const strNewSelection = {
      locations: [...newSelection.locations],
      serviceAreas: [...newSelection.serviceAreas],
      analysisAreas: [...newSelection.analysisAreas]
    }

    return !dequal(strOldSelection, strNewSelection)
  }
  
  doesConduitNeedUpdate (prevStateMapLayers, stateMapLayers) {
    if (prevStateMapLayers.showSegmentsByTag !== stateMapLayers.showSegmentsByTag) return true
    if (!dequal(prevStateMapLayers.edgeConstructionTypes, stateMapLayers.edgeConstructionTypes)) return true
    // ToDo: this is so wrong! 
    //    find what triggers an update on setNetworkEquipmentLayerVisibility
    //    and have it also trigger an update on setCableConduitVisibility when parent is visible
    if (!prevStateMapLayers || !stateMapLayers ||
        !prevStateMapLayers.networkEquipment ||
        !stateMapLayers.networkEquipment ||
        !prevStateMapLayers.networkEquipment.cables ||
        !stateMapLayers.networkEquipment.cables ||
        dequal(prevStateMapLayers, stateMapLayers)) {
      return false
    }
    var needUpdate = false
    Object.keys(stateMapLayers.networkEquipment.cables).forEach(cableType => {
      // still looking for a reason to update?
      if (!needUpdate) {
        const cable = stateMapLayers.networkEquipment.cables[cableType]
        const prevCable = prevStateMapLayers.networkEquipment.cables[cableType]
        // this all needs to be redone
        if (cable.checked) {
          if (!prevCable.checked) {
            needUpdate = true
          } else if (!dequal(cable.conduitVisibility, prevCable.conduitVisibility)) {
            needUpdate = true
          }
        }
      }
    })
    return needUpdate
  }
  
}

TileComponentController.$inject = ['$window', '$document', '$timeout', '$ngRedux', 'state','tileDataService', 'contextMenuService', 'Utils', '$scope', 'rxState']

let tile = {
  template: '',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: TileComponentController
}

export default tile
