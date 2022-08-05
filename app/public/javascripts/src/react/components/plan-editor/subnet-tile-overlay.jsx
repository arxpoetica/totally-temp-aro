/* globals google */
import React, { useState, useEffect, Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorSelectors from './plan-editor-selectors'
import PlanEditorActions from './plan-editor-actions'
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import TileDataMutator from '../common/tile-overlay/tile-data-mutator'
import tileIcons from '../common/tile-overlay/tile-icons'
// global: tileCache.subnets

let mapIcons = tileIcons.mapIcons
let iconBadges = tileIcons.iconBadges
// --- helpers --- //
const TWO_PI = 2 * Math.PI

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
    this.overlayRightClickListener = null
  }

  // --- renderer --- //

  // this may become it's own static class
  renderTileCanvas (ownerDocument, points, tileId, pointsById, badgeLists) {
    var canvas = ownerDocument.createElement('canvas')
    canvas.width = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    canvas.height = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    var ctx = canvas.getContext('2d')
    //ctx.fillStyle = '#99FF99'
    for (const [id, point] of Object.entries(points)) {
      let px = TileUtils.worldCoordToTilePixel(point, tileId)
      px.x += TileUtils.TILE_MARGIN
      px.y += TileUtils.TILE_MARGIN
      // get icon type
      let iconType = pointsById[id].locationEntityType
      let icon = mapIcons[iconType]
      // TODO: locationEntityType is not consistent across Service
      //  eg: sometimes it's "medium_businesses" 
      //      in drafts it's "medium"
      let imageCoord = {
        x: px.x - icon.offset.x,
        y: px.y - icon.offset.y,
      }
      ctx.drawImage(
        icon.image, 
        imageCoord.x, 
        imageCoord.y,
      )
      // figure badges
      // for each badge
      // TODO: should be stored in Redux as a dictionary
      if (badgeLists.alertLocationIds) {
        let hasAlertBadge = Object.values(badgeLists.alertLocationIds).find(faultNode => faultNode.faultReference.objectId === id)
        if (hasAlertBadge) {
          let badgeCoord = {
            x: imageCoord.x + iconBadges['alert'].offset.x + (icon.image.width * iconBadges['alert'].offsetMult.w),
            y: imageCoord.y + iconBadges['alert'].offset.y + (icon.image.width * iconBadges['alert'].offsetMult.h)
          }
          ctx.drawImage(
            iconBadges['alert'].image, 
            badgeCoord.x, 
            badgeCoord.y,
          )
        }
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
        tile = this.renderTileCanvas(ownerDocument, points, tileId, this.props.locationsById, {alertLocationIds: this.props.alertLocationIds})
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
    // div.innerHTML = sCoords;
    // div.style.fontSize = "10"
    // div.style.borderStyle = "solid"
    // div.style.borderWidth = "1px"
    // div.style.color = div.style.borderColor = "#AAAAAA"
    
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
      //let ts = performance.now()
      let zoom = this.props.mapRef.getZoom()
      let points = TileDataMutator.getPointsUnderClick(
        this.props.subnetTileData[this.props.selectedSubnetId], 
        event.latLng, 
        zoom
      )
      // ts = performance.now() - ts
      // console.log(ts)
      // console.log(points)
      //const ids = locations.map(location => location.object_id)
      this.props.setCursorLocationIds(Object.keys(points))
    }, 20)
  }

  onMouseOut = (event) => {
    clearTimeout(this.mousemoveTimer)
    this.props.clearCursorLocationIds()
  }

  onRightClick = (event) => {
    if (!this.props.subnetTileData[this.props.selectedSubnetId]) return
    let zoom = this.props.mapRef.getZoom()
    let points = TileDataMutator.getPointsUnderClick(
      this.props.subnetTileData[this.props.selectedSubnetId], 
      event.latLng, 
      zoom
    )
    this.props.showContextMenuForLocations(Object.keys(points), event)
  }

  addListeners () {
    //console.log(this.props.mapRef)
    //if (!this.props.mapRef) return
    this.removeListeners()
    this.overlayMouseMoveListener = google.maps.event.addListener(this.props.mapRef, 'mousemove', this.onMouseMove)
    this.overlayMouseOutListener = google.maps.event.addListener(this.props.mapRef, 'mouseout', this.onMouseOut)
    this.overlayRightClickListener = google.maps.event.addListener(this.props.mapRef, 'rightclick', this.onRightClick)
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
    google.maps.event.removeListener(this.overlayRightClickListener)
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
    this.removeListeners()
    this.removeOverlayLayer()
    console.log('component unmount')
  }

}

// --- //

const mapStateToProps = (state) => {
  const selectedSubnetId = PlanEditorSelectors.getNearestSubnetIdOfSelected(state)
  //const selectedSubnetId = 'all'
  // TODO: this should probably be a selector 
  //  OR we make it a dictionary in state
  let alertLocationIds = {}
  let locationsById = {}
  if (
    selectedSubnetId
    && state.planEditor.subnets[selectedSubnetId]
    && state.planEditor.subnets[selectedSubnetId].faultTree
  ) {
    // state.planEditor.subnets[selectedSubnetId].faultTree.rootNode.childNodes.forEach(faultNode => {
    //   alertLocationIds[faultNode.faultReference.objectId] = faultNode
    // })
    alertLocationIds = state.planEditor.subnets[selectedSubnetId].faultTree.rootNode.childNodes
    
    //locationsById = state.planEditor.subnets[selectedSubnetId].subnetLocationsById
    //let rootId = PlanEditorSelectors.getRootSubnetIdForSelected(state)
    
    locationsById = state.planEditor.draftLocations.households
  }
  //locationsById = state.planEditor.draftLocations.groups
  return {
    mapRef: state.map.googleMaps,
    subnetTileData: state.subnetTileData, 
    //selectedSubnetId: state.planEditor.selectedSubnetId,
    selectedSubnetId,
    //rootSubnetId: PlanEditorSelectors.getRootSubnetIdForSelected(state),
    // tile data, useEffect: on change tell overlayLayer to run getTile on all visible tiles using clearTileCache
    // tileOverlay.clearTileCache();
    alertLocationIds, // TODO: when this changes the action creator needs to clear the cache
    locationsById, 
  }
}

const mapDispatchToProps = dispatch => ({
  setCursorLocationIds: ids => dispatch(PlanEditorActions.setCursorLocationIds(ids)),
  clearCursorLocationIds: () => dispatch(PlanEditorActions.clearCursorLocationIds()),
  showContextMenuForLocations: (featureIds, event) => dispatch(PlanEditorActions.showContextMenuForLocations(featureIds, event)),
})

const SubnetTileOverlay = wrapComponentWithProvider(reduxStore, _SubnetTileOverlay, mapStateToProps, mapDispatchToProps)
export default SubnetTileOverlay
