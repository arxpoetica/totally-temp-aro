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
    // TODO: remove this once old VTS is retired
    mapOverlayEle.redrawCachedTiles = (prop) => {/*console.log(prop)*/} // called by the OLD VTS

    return mapOverlayEle
  }

  initMapConnection () {
    console.log("--- try init ---")
    console.log(this.props.mapRef)
    if (this.props.mapRef && !this.mapOverlayEle) {
      this.mapOverlayEle = this.makeMapOverlayEle()
      this.props.mapRef.overlayMapTypes.push(this.mapOverlayEle) // this will cause a tile refresh
      console.log(this.props.mapRef.overlayMapTypes)
      // - add mouse listeners 
      this.addListeners()

      return true
    }
    return false
  }

  // - on data update - //

  refreshTiles () {
    // digest new data
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
    //console.log(tileCaches)
    // this runs whenever state data changes
    //  we check to see what layers are active, in what state, repopulate with new badge data etc
    // no need to de-init TileOverlays don't have listeners or state
    // ABS: I think badgeLists should be a selector
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
          'isMouseEvents': false, // TODO: expand this when we have layers that have different event needs
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
            'isMouseEvents': true,
          },
        }
        this.tileOverlaysByZOrder.push(this.tileOverlaysByID['PLAN_EDIT_SUBNET_LOCATIONS'])
      }
    }

    if (
      'VIEW' === this.props.selectedDisplayMode 
      && 'nearnet' in this.props.nearnetTileData
      && 'excluded' in this.props.nearnetTileData
    ) {
      console.log(nearnetLayers.includes('near_net'))
      if (nearnetLayers.includes('near_net')) {
        this.tileOverlaysByID['NEARNET_NEARNET'] = {
          'id': 'NEARNET_NEARNET',
          'overlay': new TileOverlay(
            this.props.nearnetTileData['nearnet'],
            tileCaches.nearnet.nearnet,
            this.props.nearnetEntityData,
          ),
          'meta': {
            'zIndex': 1,
            //'isOn': false,
            'opacity': 1.0,
            'isMouseEvents': false,
          },
        }
        this.tileOverlaysByZOrder.push(this.tileOverlaysByID['NEARNET_NEARNET'])
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
    
    return div;
  }

  // - on tile release - //
  // arrow function used here to bind the function to 'this'
  overlayReleaseTileCallback = (domEle) => {
    //console.log(domEle)
  }


  // - on mouse - //
  // FUTURE: different layers may have different event->action needs
  getFeaturesAtLatLng (latLng) {
    let points = []
    let zoom = this.props.mapRef.getZoom()
    // for each tileOverlay where isOn and isMouseEvents
    for (let layer of this.tileOverlaysByZOrder) {
      if (layer.meta.isMouseEvents) {
        let layerPoints = layer.overlay.getPointsUnderClick(latLng, zoom)
        points = Object.keys(layerPoints).concat(points) // points order is inverse layer order, top at beginning
      }
    }
    return points
  }

  onMouseMove = (event) => {
    clearTimeout(this.mousemoveTimer)
    this.mousemoveTimer = setTimeout(async() => {
      //let ts = performance.now()
      let points = this.getFeaturesAtLatLng(event.latLng)
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
    let points = this.getFeaturesAtLatLng(event.latLng)
    this.props.showContextMenuForLocations(points, event)
  }

  addListeners () {
    this.removeListeners()
    this.overlayMouseMoveListener = google.maps.event.addListener(this.props.mapRef, 'mousemove', this.onMouseMove)
    this.overlayMouseOutListener = google.maps.event.addListener(this.props.mapRef, 'mouseout', this.onMouseOut)
    this.overlayRightClickListener = google.maps.event.addListener(this.props.mapRef, 'rightclick', this.onRightClick)
  }

  removeListeners () {
    google.maps.event.removeListener(this.overlayMouseMoveListener)
    google.maps.event.removeListener(this.overlayMouseOutListener)
    google.maps.event.removeListener(this.overlayRightClickListener)
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
    console.log(' --- component update --- ')
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
    //nearnetFilters: state.mapLayers.filters.near_net,
    nearnetLayers: state.mapLayers.filters.near_net.location_filters.multiSelect,
    selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  }
}

const mapDispatchToProps = dispatch => ({
  setCursorLocationIds: ids => dispatch(PlanEditorActions.setCursorLocationIds(ids)),
  clearCursorLocationIds: () => dispatch(PlanEditorActions.clearCursorLocationIds()),
  showContextMenuForLocations: (featureIds, event) => dispatch(PlanEditorActions.showContextMenuForLocations(featureIds, event)),
})

const TileOverlayComposer = wrapComponentWithProvider(reduxStore, _TileOverlayComposer, mapStateToProps, mapDispatchToProps)
export default TileOverlayComposer
