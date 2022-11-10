/* globals google */
import React, { useState, useEffect, Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'

import PlanEditorSelectors from '../../plan-editor/plan-editor-selectors'
import PlanEditorActions from '../../plan-editor/plan-editor-actions'
import MapDataSelectors from './map-data-selectors'

import TileUtils from './tile-overlay-utils'
import { tileCaches } from './tile-cache'

import TileOverlay from './tile-overlay'
import { mapHitFeatures } from '../../sidebar/constants'
import SelectionActions from '../../selection/selection-actions'


// needs to be a class instance becasue is needs to keep a scope for the getTile callback functions
class _TileOverlayComposer extends Component {
  constructor (props) {
    super(props)
    this.mapOverlayEle = null
    
    this.mousemoveTimer = null
    this.overlayMouseMoveListener = null
    this.overlayMouseOutListener = null
    this.overlayRightClickListener = null

    // TODO: make this a single structure, an ordered dictionary
    this.tileOverlaysByID = {}
    this.tileOverlaysByZOrder = []
    // this.tileOverlays = {
    //   id: {},
    //   list: []
    // } // shold probably do accessors - probably just extend Array, this is a much bigger project
  }

  // --- //

  // - on init - //

  makeMapOverlayEle () {
    let mapOverlayEle = {}
    mapOverlayEle.tileSize = new google.maps.Size(TileUtils.TILE_SIZE, TileUtils.TILE_SIZE)
    
    mapOverlayEle.getTile = this.overlayGetTileCallback
    mapOverlayEle.releaseTile = this.overlayReleaseTileCallback
    
    return mapOverlayEle
  }

  initMapConnection () {
    if (this.props.mapRef && !this.mapOverlayEle) {
      this.mapOverlayEle = this.makeMapOverlayEle()
      this.props.mapRef.overlayMapTypes.push(this.mapOverlayEle) // this will cause a tile refresh
      // - add mouse listeners 
      this.addListeners()

      return true
    }
    return false
  }

  // - on data update - //

  refreshTiles () {
    // digest new data

    //TODO: clear cache for badge change but ONLY effected tiles

    this.makeActiveOverlays()
    if (this.mapOverlayEle) {
      // we have initialized so refresh
      // if (this.removeMapOverlayEle()) { // ABS why do we need to check this?
      //   // IF we don't want a centralised tile composer we can use 
      //   //  overlayMapTypes.insertAt to set our tile layer at a specfied Z index
      //   this.props.mapRef.overlayMapTypes.push(this.mapOverlayEle) // this will cause a tile refresh
      // }
      this.removeMapOverlayEle()
      this.props.mapRef.overlayMapTypes.push(this.mapOverlayEle) // this will cause a tile refresh
    } else {
      // we haven't initialized yet so try that
      this.initMapConnection()
    }
  }

  makeActiveOverlays () {
    // this runs whenever state data changes
    //  we check to see what layers are active, in what state, repopulate with new badge data etc
    // no need to de-init TileOverlays don't have listeners or state
    // ABS: I think badgeLists should be a selector
    // TODO: mouseEvents should include function so we can do unique functions per layer
    this.tileOverlaysByID = {}
    this.tileOverlaysByZOrder = []

    if ('EDIT_PLAN' === this.props.selectedDisplayMode) {
      this.tileOverlaysByID['PLAN_EDIT_ALL_LOCATIONS'] = {
        'id': 'PLAN_EDIT_ALL_LOCATIONS',
        'overlay': new TileOverlay(
          this.props.subnetTileData['all'], 
          tileCaches.subnets['all'], 
          this.props.groupsById,
          {'inactive': this.props.unselectedLocationGroups}
        ),
        'meta': {
          'zIndex': 1,
          //'isOn': false,
          'opacity': 0.5,
          'mouseEvents': ['mouseover', 'rightclick'], 
        },
      }
      this.tileOverlaysByZOrder.push(this.tileOverlaysByID['PLAN_EDIT_ALL_LOCATIONS'])

      if (this.props.selectedSubnetId) {
        this.tileOverlaysByID['PLAN_EDIT_SUBNET_LOCATIONS'] = {
          'id': 'PLAN_EDIT_SUBNET_LOCATIONS',
          'overlay': new TileOverlay(
            this.props.subnetTileData[this.props.selectedSubnetId],
            tileCaches.subnets[this.props.selectedSubnetId],
            this.props.locationsById,
            {'alert': this.props.alertLocationIds}
          ),
          'meta': {
            'zIndex': 2,
            //'isOn': false,
            'opacity': 1.0,
            'mouseEvents': ['mouseover', 'rightclick'],
          },
        }
        this.tileOverlaysByZOrder.push(this.tileOverlaysByID['PLAN_EDIT_SUBNET_LOCATIONS'])
      }
    }

    if ('VIEW' === this.props.selectedDisplayMode) {
      let selectedList = {}
      if (this.props.selectedNearnetEntities.length) {
        selectedList[this.props.selectedNearnetEntities[0].objectId] = this.props.selectedNearnetEntities[0]
      }
      
      if (
        this.props.nearnetLayers.includes('far_net')
        && 'excluded' in this.props.nearnetTileData
      ) {
        this.tileOverlaysByID['NEARNET_EXCLUDED'] = {
          'id': 'NEARNET_EXCLUDED',
          'overlay': new TileOverlay(
            this.props.nearnetTileData['excluded'],
            tileCaches.nearnet['excluded'],
            this.props.nearnetEntityData,
            {selected: selectedList},
          ),
          'meta': {
            'zIndex': 3,
            //'isOn': false,
            'opacity': 0.7,
            'mouseEvents': ['click', 'rightclick'],
          },
        }
        this.tileOverlaysByZOrder.push(this.tileOverlaysByID['NEARNET_EXCLUDED'])
      }

      if (
        this.props.nearnetLayers.includes('near_net')
        && 'nearnet' in this.props.nearnetTileData
      ) {
        this.tileOverlaysByID['NEARNET_NEARNET'] = {
          'id': 'NEARNET_NEARNET',
          'overlay': new TileOverlay(
            this.props.nearnetTileData['nearnet'],
            tileCaches.nearnet['nearnet'],
            this.props.nearnetEntityData,
            {selected: selectedList},
            ['nearnet'],
          ),
          'meta': {
            'zIndex': 4,
            //'isOn': false,
            'opacity': 1.0,
            'mouseEvents': ['click', 'rightclick'],
          },
        }
        this.tileOverlaysByZOrder.push(this.tileOverlaysByID['NEARNET_NEARNET'])
      }

      if (
        this.props.nearnetLayers.length
        && 'routed' in this.props.nearnetTileData
      ) {
        this.tileOverlaysByID['NEARNET_ROUTED'] = {
          'id': 'NEARNET_ROUTED',
          'overlay': new TileOverlay(
            this.props.nearnetTileData['routed'],
            tileCaches.nearnet['routed'],
            this.props.nearnetEntityData,
            {selected: selectedList},
          ),
          'meta': {
            'zIndex': 5,
            //'isOn': false,
            'opacity': 1.0,
            'mouseEvents': ['click', 'rightclick'],
          },
        }
        this.tileOverlaysByZOrder.push(this.tileOverlaysByID['NEARNET_ROUTED'])
      }

    }
  }

  // - on render request - //

  // arrow function used here to bind the function to 'this'
  //  This is a callback sent to google.maps on mapOverlayEle
  //  it gets called everytime a tile initially enters the view.
  //  BUT it needs to be attached to 'this' so that 
  //  when it's called it uses the current (at call time) values of 
  //  this.props.subnetTileData and this.props.selectedSubnetId
  //  instead of the values at time of function declarition 
  overlayGetTileCallback = (coord, zoom, ownerDocument) => {
    // FUTURE: each type may have different zoom cutoff levels
    // TODO: once old Vector Tile is gone revisit the cut-off zoom
    //  we're more performat so we can probably drop that to like zoom < 8 or 9 
    if (zoom < 10) return null
    // ?should we cache the div as well?
    const div = ownerDocument.createElement("div")
    
    div.style.width = `${TileUtils.TILE_SIZE}px`
    div.style.height = `${TileUtils.TILE_SIZE}px`
    div.style.position = 'relative'
    div.style.overflow = 'visible'

    // if debug on
    // div.innerHTML = sCoords;
    // div.style.fontSize = "10"
    // div.style.borderStyle = "solid"
    // div.style.borderWidth = "1px"
    // div.style.color = div.style.borderColor = "#AAAAAA"
    
    //let begin = window.performance.now()

    let tileId = TileUtils.coordToTileId(coord, zoom)
    for (let layer of this.tileOverlaysByZOrder) {
      let tile = layer.overlay.getTileCanvas(ownerDocument, tileId)
      if (tile) {
        div.appendChild(tile)
        tile.style.position = 'absolute'
        tile.style.left = `-${TileUtils.TILE_MARGIN}px`
        tile.style.top = `-${TileUtils.TILE_MARGIN}px`
        if (layer.meta.opacity != 1.0) tile.style.opacity = layer.meta.opacity // TODO: change this to apply a style prop directly from meta
      }

    }
    
    //let elapse = window.performance.now() - begin
    //console.log(`${elapse} milliseconds`)
    return div;
  }

  // - on tile release - //
  // arrow function used here to bind the function to 'this'
  overlayReleaseTileCallback = (domEle) => {
    //console.log(domEle)
  }


  // - on mouse - //
  // FUTURE: different layers may have different event->action needs
  getFeaturesAtLatLng (latLng, layers) {
    let points = []
    let zoom = this.props.mapRef.getZoom()
    // for each tileOverlay where isOn and isMouseEvents
    for (let layer of layers) {
      let layerPoints = layer.overlay.getPointsUnderClick(latLng, zoom)
      points = Object.keys(layerPoints).concat(points) // points order is inverse layer order, top at beginning
    }
    return points
  }

  getLayersForEvent (eventName) {
    let layers = []
    for (let layer of this.tileOverlaysByZOrder) {
      if (layer.meta.mouseEvents.includes(eventName)) {
        layers.push(layer)
      }
    }
    return layers
  }

// --- //

  onMouseMove = (event) => {
    clearTimeout(this.mousemoveTimer)
    this.mousemoveTimer = setTimeout(async() => {
      //let ts = performance.now()
      let points = this.getFeaturesAtLatLng(event.latLng, this.getLayersForEvent('mouseover'))
      // ts = performance.now() - ts
      // console.log(ts)
      // console.log(points)
      this.props.setCursorLocationIds(points)
    }, 20)
  }

  onMouseOut = (event) => {
    clearTimeout(this.mousemoveTimer)
    this.props.clearCursorLocationIds()
  }

  onRightClick = (event) => {
    let points = this.getFeaturesAtLatLng(event.latLng, this.getLayersForEvent('rightclick'))
    // TODO: make this a dynamic system instead of hardcoded 'if'
    if ('VIEW' === this.props.selectedDisplayMode) {
      this.onRightClickNearnet(points, event)
    } else {
      this.props.showContextMenuForLocations(points, event)
    }
  }

  onClick = (event) => {
    let points = this.getFeaturesAtLatLng(event.latLng, this.getLayersForEvent('click'))
    //console.log(event)
    //if (points.length) this.stopEventPropigation(event)
    this.onClickNearnet(points, event)// TODO: generalize this
  }
  onClickNearnet (points, event) {
    // let locations = []
    // for (const locationId of points) {
    //   locations.push(this.props.nearnetEntityData[locationId])
    // }
    // console.log(locations)
    //this.props.setLocationInfo(locationInfo)
    if (!points.length) return
    let locationInfo = this.props.nearnetEntityData[points[0]]
    this.props.selectNearnetEntities([locationInfo])
  }

  onRightClickNearnet (points, event) {
    if (!points.length) return
    let locations = []
    for (const locationId of points) {
      locations.push(this.props.nearnetEntityData[locationId])
    }
    this.props.nearnetContextMenu(locations, event)
  }

  // stopEventPropigation (event) {
  //   event.stop()
  //   event.domEvent.stopPropagation()
  //   event.domEvent.cancelBubble = true;
  // }

  addListeners () {
    this.removeListeners()
    this.overlayMouseMoveListener = google.maps.event.addListener(this.props.mapRef, 'mousemove', this.onMouseMove)
    this.overlayMouseOutListener = google.maps.event.addListener(this.props.mapRef, 'mouseout', this.onMouseOut)
    this.overlayRightClickListener = google.maps.event.addListener(this.props.mapRef, 'rightclick', this.onRightClick)
    this.overlayClickListener = google.maps.event.addListener(this.props.mapRef, 'click', this.onClick)
  }

  removeListeners () {
    google.maps.event.removeListener(this.overlayMouseMoveListener)
    google.maps.event.removeListener(this.overlayMouseOutListener)
    google.maps.event.removeListener(this.overlayRightClickListener)
    google.maps.event.removeListener(this.overlayClickListener)
  }

  // --- //

  removeMapOverlayEle () {
    if (this.props.mapRef && this.props.mapRef.overlayMapTypes.length) {
      let index = this.props.mapRef.overlayMapTypes.indexOf(this.mapOverlayEle)
      if (-1 < index) {
        this.props.mapRef.overlayMapTypes.removeAt(index)
        return true
      }
    }
    return false
  }

  // --- lifecycle hooks --- //
  // No UI for this component. It deals with map objects only.
  render() { return null }

  componentDidMount() { 
    this.refreshTiles() // will init if it can and hasn't yet
  }

  componentDidUpdate(/*prevProps, prevState*/) {
    //console.log(' ------- TOS updated ------- ')
    this.refreshTiles() // will init if it can and hasn't yet
  }

  componentWillUnmount() {
    this.removeListeners()
    this.removeMapOverlayEle()
    this.mapOverlayEle = null
  }

}

// --- //

// this is needed because:
//  A component's mapStateToProps function is called EVERY time ANYTHING in redux changes, 
//  the return is then evaluated against the previous return and if they don't match exactly the component rerenders. 
//  If you redeclare the empty object every function call it will be a NEW empty object 
//  and will not match the previous return and thus will rerender EVERY time ANYTHING in redux changes. 

const defaultAlertLocationIds = {}
const defaultLocationsById = {}

const mapStateToProps = (state) => {
  const selectedSubnetId = PlanEditorSelectors.getNearestSubnetIdOfSelected(state)
  // TODO: this should probably be a selector 
  //  OR we make it a dictionary in state
  let alertLocationIds = defaultAlertLocationIds
  let locationsById = defaultLocationsById
  if (
    selectedSubnetId
    && state.planEditor.subnets[selectedSubnetId]
    && state.planEditor.subnets[selectedSubnetId].faultTree
  ) {
    alertLocationIds = state.planEditor.subnets[selectedSubnetId].faultTree.rootNode.childNodes
    locationsById = state.planEditor.draftLocations.households
  }
  
  return {
    mapRef: state.map.googleMaps,
    subnetTileData: state.mapData.tileData.subnets, // state.subnetTileData,
    selectedSubnetId,
    alertLocationIds, // when this changes the action creator needs to clear the cache, this happens because the cache is cleared when the subnet data is updated (parent to this object)
    locationsById,
    groupsById: state.planEditor.draftLocations.groups,
    unselectedLocationGroups: MapDataSelectors.getUnselectedLocationGroups(state),
    nearnetTileData: state.mapData.tileData.nearnet,
    nearnetEntityData: state.mapData.entityData.nearnet,
    nearnetFilters: state.mapLayers.filters.near_net,
    nearnetLayers: state.mapLayers.filters.near_net.location_filters.multiSelect,
    selectedNearnetEntities: state.selection.nearnetEntities,
    selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  }
}

const mapDispatchToProps = dispatch => ({
  setCursorLocationIds: ids => dispatch(PlanEditorActions.setCursorLocationIds(ids)),
  clearCursorLocationIds: () => dispatch(PlanEditorActions.clearCursorLocationIds()),
  selectNearnetEntities: (locations) => dispatch(SelectionActions.selectNearnetEntities(locations)), // setIsMapClicked?
  nearnetContextMenu: (locations, event) => dispatch(SelectionActions.nearnetContextMenu(locations, event)),
  showContextMenuForLocations: (featureIds, event) => dispatch(PlanEditorActions.showContextMenuForLocations(featureIds, event)),
})

const TileOverlayComposer = wrapComponentWithProvider(reduxStore, _TileOverlayComposer, mapStateToProps, mapDispatchToProps)
export default TileOverlayComposer
