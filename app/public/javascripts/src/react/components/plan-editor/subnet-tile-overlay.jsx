/* globals google */
import React, { useState, useEffect, Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorSelectors from './plan-editor-selectors'
import PlanEditorActions from './plan-editor-actions'
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import TileDataMutator from '../common/tile-overlay/tile-data-mutator'
// global: tileCache.subnets

// --- helpers --- //
const TWO_PI = 2 * Math.PI

// this will be it's own importable file
let mapIcons = {
  'small_businesses': {
    image: null,
    size: {
      w: 16,
      h: 16,
    },
    // offset: { // if not present will use center
    //   x: 0,
    //   y: 0,
    // },
  },
}
var loadImg_small_businesses = new Image()
loadImg_small_businesses.addEventListener('load', function() {
  console.log(`image loaded ${this}`)
  mapIcons['small_businesses'].image = this
  mapIcons['small_businesses'].size.w = this.width
  mapIcons['small_businesses'].size.h = this.height
  if (!mapIcons['small_businesses'].offset) {
    mapIcons['small_businesses'].offset = {
      x: Math.floor(this.width * 0.5),
      y: Math.floor(this.height * 0.5),
    }
  }
}, false)
loadImg_small_businesses.src = '/images/map_icons/aro/businesses_small_default.png'

let iconsBadges = {
  'alert': {
    image: null,
    size: {
      w: 16,
      h: 16,
    },
    offset: { // if not present will use center
      x: -1,
      y: 12,
    },
  },
}
var loadImg_alert = new Image()
loadImg_alert.addEventListener('load', function() {
  console.log(`image loaded ${this}`)
  iconsBadges['alert'].image = this
  iconsBadges['alert'].size.w = this.width
  iconsBadges['alert'].size.h = this.height
  if (!iconsBadges['alert'].offset) {
    iconsBadges['alert'].offset = {
      x: Math.floor(this.width * 0.5),
      y: Math.floor(this.height * 0.5),
    }
  }
}, false)
loadImg_alert.src = '/images/map_icons/badges/badge_alert.png'




// needs to be a class instance becasue is needs to keep a scope for the getTile callback functions
class _SubnetTileOverlay extends Component {
  constructor (props) {
    super(props)
    this.overlayLayer = null
    // TODO: we will do two layers
    //  the bottom one will be all locations at half opacity
    this.mousemoveTimer = null
    this.overlayMouseMoveListener = null
    this.overlayMouseOutListener = null
  }

  // --- renderer --- //

  // this may become it's own static class
  renderTileCanvas (ownerDocument, points, tileId, state) {
    var canvas = ownerDocument.createElement('canvas')
    canvas.width = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    canvas.height = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    var ctx = canvas.getContext('2d')

    ctx.fillStyle = '#99FF99'
    for (const [id, point] of Object.entries(points)) {
      let px = TileUtils.worldCoordToTilePixel(point, tileId)
      px.x += TileUtils.TILE_MARGIN
      px.y += TileUtils.TILE_MARGIN
      // get icon type
      // //ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)
      // ctx.beginPath()
      // ctx.arc(px.x+TileUtils.TILE_MARGIN, px.y+TileUtils.TILE_MARGIN, 5, 0, TWO_PI)
      // ctx.fill()
      ctx.drawImage(
        mapIcons['small_businesses'].image, 
        px.x - mapIcons['small_businesses'].offset.x, 
        px.y - mapIcons['small_businesses'].offset.y
      )
      // figure badges
      // for each badge
      // TODO: should be stored in Redux as a dictionary
      let hasAlertBadge = Object.values(state.alertLocationIds).find(faultNode => faultNode.faultReference.objectId === id)
      if (hasAlertBadge) {
        ctx.drawImage(
          iconsBadges['alert'].image, 
          px.x - iconsBadges['alert'].offset.x, 
          px.y - iconsBadges['alert'].offset.y
        )
      }
    }

    return canvas
  }

  getTileCanvas (ownerDocument, tileData, tileCache, tileId) {
    let tile = tileCache.getTile(tileId)
    if (!tile) {
      // not in the cache so render it
      let points = TileDataMutator.getPointsForTile(tileData, tileId)
      //console.log(points)
      if (Object.keys(points).length) {
        // render tile
        tile = this.renderTileCanvas(ownerDocument, points, tileId, {alertLocationIds: this.props.alertLocationIds})
        tileCache.addTile(tile, tileId)
      }
    }
    return tile
  }

  // --- overlay layer --- //

  // arrow function used here to bind the function to 'this'
  //  This is a callback sent to google.maps on overlayLayer
  //  it gets called everytime a tile initially enters the view.
  //  BUT it needs to be attached to 'this' so that 
  //  when it's called it uses the current (at call time) values of 
  //  this.props.subnetTileData and this.props.selectedSubnetId
  //  instead of the values at time of function declarition 
  overlayGetTileCallback = (coord, zoom, ownerDocument) => {
    let sCoords = String(coord)
    //console.log(`getTile ${sCoords} ${zoom}`)
    //console.log(this.props.selectedSubnetId)

    const div = ownerDocument.createElement("div")
    
    div.style.width = `${TileUtils.TILE_SIZE}px`
    div.style.height = `${TileUtils.TILE_SIZE}px`
    div.style.position = 'relative'
    div.style.overflow = 'visible'

    let tile = null
    if (this.props.subnetTileData[this.props.selectedSubnetId] && tileCache.subnets[this.props.selectedSubnetId]) {
      let tileId = TileUtils.coordToTileId(coord, zoom)
      //console.log(tileId)
      tile = this.getTileCanvas(
        ownerDocument, 
        this.props.subnetTileData[this.props.selectedSubnetId], 
        tileCache.subnets[this.props.selectedSubnetId], 
        tileId
      )
    }

    
    // if debug on
    div.innerHTML = sCoords;
    div.style.fontSize = "10"
    div.style.borderStyle = "solid"
    div.style.borderWidth = "1px"
    div.style.color = div.style.borderColor = "#AAAAAA"
    
    if (tile) {
      div.appendChild(tile)
      tile.style.position = 'absolute'
      tile.style.left = `-${TileUtils.TILE_MARGIN}px`
      tile.style.top = `-${TileUtils.TILE_MARGIN}px`
      //console.log(tile)
    }

    //console.log(div)
    
    return div;
  }

  // arrow function used here to bind the function to 'this'
  overlayReleaseTileCallback = (domEle) => {
    //console.log(domEle)
  }

  makeOverlayLayer () {
    let overlayLayer = {}
    overlayLayer.tileSize = new google.maps.Size(TileUtils.TILE_SIZE, TileUtils.TILE_SIZE)
    
    overlayLayer.getTile = this.overlayGetTileCallback

    overlayLayer.releaseTile = this.overlayReleaseTileCallback

    // remove this once old VTS is retired
    overlayLayer.redrawCachedTiles = (prop) => {console.log(prop)} // called by the OLD VTS

    return overlayLayer
  }


  // --- //

  initOverlayLayer () {
    if (this.props.mapRef && this.props.selectedSubnetId && !this.overlayLayer) {
      this.overlayLayer = this.makeOverlayLayer()
      this.props.mapRef.overlayMapTypes.push(this.overlayLayer) // this will cause a tile refresh

      // --- add mouse listeners 
      this.addListeners()

      return true
    }
    return false
  }

  onMouseMove = (event) => {
    clearTimeout(this.mousemoveTimer)
    this.mousemoveTimer = setTimeout(async() => {
      if (!this.props.subnetTileData[this.props.selectedSubnetId]) return
      let ts = performance.now()
      //const { locations } = await this.getFeaturesUnderLatLng(event.latLng)
      //console.log(event)
      let zoom = this.props.mapRef.getZoom()
      let points = TileDataMutator.getPointsUnderClick(
        this.props.subnetTileData[this.props.selectedSubnetId], 
        event.latLng, 
        zoom
      )
      ts = performance.now() - ts
      console.log(ts)
      console.log(points)
      //const ids = locations.map(location => location.object_id)
      this.props.setCursorLocationIds(Object.keys(points)) // hitch to new VTS 
    }, 20)
  }

  onMouseOut = (event) => {
    clearTimeout(this.mousemoveTimer)
    this.props.clearCursorLocationIds()
  }

  addListeners () {
    //console.log(this.props.mapRef)
    //if (!this.props.mapRef) return
    this.removeListeners()
    console.log(this)
    this.overlayMouseMoveListener = google.maps.event.addListener(this.props.mapRef, 'mousemove', this.onMouseMove)
    this.overlayMouseOutListener = google.maps.event.addListener(this.props.mapRef, 'mouseout', this.onMouseOut)
  }

  removeOverlayLayer () {
    if (this.props.mapRef && this.props.mapRef.overlayMapTypes.length) {
      let index = this.props.mapRef.overlayMapTypes.indexOf(this.overlayLayer)
      if (-1 < index) {
        this.props.mapRef.overlayMapTypes.removeAt(index)
        return true
      }
    }
    return false
  }

  removeListeners () {
    //if (!this.props.mapRef) return
    google.maps.event.removeListener(this.overlayMouseMoveListener)
    google.maps.event.removeListener(this.overlayMouseOutListener)
  }

  refreshTiles () {
    if (this.overlayLayer) {
      // we have initialized so refresh
      if (this.removeOverlayLayer()) {
        this.props.mapRef.overlayMapTypes.push(this.overlayLayer) // this will cause a tile refresh
      }
    } else {
      // we haven't initialized yet so try that
      this.initOverlayLayer()
    }
  }

  // --- lifecycle hooks --- //
  // No UI for this component. It deals with map objects only.
  render() { return null }

  componentDidMount() { 
    //console.log(' --- mount --- ') 
    this.refreshTiles() // will init if it can and hasn't yet
  }

  componentDidUpdate(/* prevProps, prevState, snapshot */) {
    //console.log(' --- update --- ') 
    this.refreshTiles() // will init if it can and hasn't yet
    // we could check to make sure that either selectedSubnetId changed 
    //  OR subnetTileData changed on the subnet we are showing
    //  BUT that would probably take longer than simply querying cached tiles 
  }

  componentWillUnmount() {
    this.removeOverlayLayer()
    console.log('component unmount')
    this.removeListeners()
  }

}

// --- //

const mapStateToProps = (state) => {
  const selectedSubnetId = PlanEditorSelectors.getNearestSubnetIdOfSelected(state)
  // TODO: this should probably be a selector 
  //  OR we make it a dictionary in state
  let alertLocationIds = {}
  if (
    selectedSubnetId
    && state.planEditor.subnets[selectedSubnetId]
    && state.planEditor.subnets[selectedSubnetId].faultTree
  ) {
    // state.planEditor.subnets[selectedSubnetId].faultTree.rootNode.childNodes.forEach(faultNode => {
    //   alertLocationIds[faultNode.faultReference.objectId] = faultNode
    // })
    alertLocationIds = state.planEditor.subnets[selectedSubnetId].faultTree.rootNode.childNodes
  }
  return {
    mapRef: state.map.googleMaps,
    subnetTileData: state.subnetTileData, 
    //selectedSubnetId: state.planEditor.selectedSubnetId,
    selectedSubnetId,
    //rootSubnetId: PlanEditorSelectors.getRootSubnetIdForSelected(state),
    // tile data, useEffect: on change tell overlayLayer to run getTile on all visible tiles using clearTileCache
    // tileOverlay.clearTileCache();
    alertLocationIds, // TODO: when this changes the action creator needs to clear the cache
  }
}

const mapDispatchToProps = dispatch => ({
  setCursorLocationIds: ids => dispatch(PlanEditorActions.setCursorLocationIds(ids)),
  clearCursorLocationIds: () => dispatch(PlanEditorActions.clearCursorLocationIds()),
})

const SubnetTileOverlay = wrapComponentWithProvider(reduxStore, _SubnetTileOverlay, mapStateToProps, mapDispatchToProps)
export default SubnetTileOverlay
