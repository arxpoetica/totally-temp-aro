/* globals google */
import React, { useState, useEffect, Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorSelectors from './plan-editor-selectors'
import PlanEditorActions from './plan-editor-actions'
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import TileDataMutator from '../common/tile-overlay/tile-data-mutator'
import tileIcons from '../common/tile-overlay/tile-icons'
import SubnetTileSelectors from './subnet-tile-selectors'
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
  renderTileCanvas (ownerDocument, points, tileId, pointMetaById, badgeLists) {
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
      let iconType = pointMetaById[id].locationEntityType
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
      for (const [badgeId, badge] of Object.entries(iconBadges)) {
        // badgeLists is a collection of id collectiions with the schema 
        //  badgeLists: {
        //    $badgeId: {
        //      $pointId: bool
        //    }
        //  }
        //  if the badgeLists isn't present
        //    or if the pointId isn't in the list 
        //    or if the value of badgeLists[badgeId][id] is false
        //    the badge will not be drawn for this point, all three are valid means and are usful in different scenarios 
        
        if (badgeLists[badgeId] && badgeLists[badgeId][id]) {
          let badgeCoord = {
            x: imageCoord.x + badge.offset.x + (icon.image.width * badge.offsetMult.w),
            y: imageCoord.y + badge.offset.y + (icon.image.width * badge.offsetMult.h)
          }
          ctx.drawImage(
            badge.image, 
            badgeCoord.x, 
            badgeCoord.y,
          )
        }
      }
    }

    return canvas
  }

  getTileCanvas (ownerDocument, tileData, tileCache, tileId, pointMetaById, badgeLists) { // TODO: should all these be sent or pulled from "this."? Figure it out when we abstract this Component for use with view mode
    let tile = tileCache.getTile(tileId)
    if (!tile) {
      // not in the cache so render it
      let points = TileDataMutator.getPointsForTile(tileData, tileId)
      if (Object.keys(points).length) {
        // render tile
        tile = this.renderTileCanvas(ownerDocument, points, tileId, pointMetaById, badgeLists)
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

    // for the moment we're just going to sneak the 'all' layer underneith
    //  TODO: make a proper layering system 
    for (const tileDataKey of ['all', this.props.selectedSubnetId]) {
      let isUnderlay = (tileDataKey === 'all') // hack will fix later
      let tile = null
      if (this.props.subnetTileData[tileDataKey] && tileCache.subnets[tileDataKey]) {
        let tileId = TileUtils.coordToTileId(coord, zoom)
        
        let badgeLists = {}
        let pointMetaById = this.props.locationsById 
        if (isUnderlay) {
          pointMetaById = this.props.groupsById
          badgeLists['inactive'] = this.props.unselectedLocationGroups
        } else {
          badgeLists['alert'] = this.props.alertLocationIds
        }

        tile = this.getTileCanvas(
          ownerDocument, 
          this.props.subnetTileData[tileDataKey], 
          tileCache.subnets[tileDataKey], 
          tileId,
          pointMetaById,
          badgeLists
        )
      }
      
      if (tile) {
        div.appendChild(tile)
        tile.style.position = 'absolute'
        tile.style.left = `-${TileUtils.TILE_MARGIN}px`
        tile.style.top = `-${TileUtils.TILE_MARGIN}px`
        if (isUnderlay) tile.style.opacity = 0.5
      }
    }
    
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
    this.refreshTiles() // will init if it can and hasn't yet
  }

  componentDidUpdate(/* prevProps, prevState, snapshot */) {
    this.refreshTiles() // will init if it can and hasn't yet
    // we could check to make sure that either selectedSubnetId changed 
    //  OR subnetTileData changed on the subnet we are showing
    //  BUT that would probably take longer than simply querying cached tiles 

    // - make derived data (or selector?) - //

  }

  componentWillUnmount() {
    this.removeListeners()
    this.removeOverlayLayer()
  }

}

// --- //

const mapStateToProps = (state) => {
  const selectedSubnetId = PlanEditorSelectors.getNearestSubnetIdOfSelected(state)
  // TODO: this should probably be a selector 
  //  OR we make it a dictionary in state
  let alertLocationIds = {}
  let locationsById = {}
  if (
    selectedSubnetId
    && state.planEditor.subnets[selectedSubnetId]
    && state.planEditor.subnets[selectedSubnetId].faultTree
  ) {
    alertLocationIds = state.planEditor.subnets[selectedSubnetId].faultTree.rootNode.childNodes
    locationsById = state.planEditor.draftLocations.households
  }
  let groupsById = state.planEditor.draftLocations.groups
  return {
    mapRef: state.map.googleMaps,
    subnetTileData: state.subnetTileData, 
    selectedSubnetId,
    alertLocationIds, // when this changes the action creator needs to clear the cache, this happens because the cache is cleared when the subnet data is updated (parent to this object)
    locationsById,
    groupsById,
    unselectedLocationGroups: SubnetTileSelectors.getUnselectedLocationGroups(state),
  }
}

const mapDispatchToProps = dispatch => ({
  setCursorLocationIds: ids => dispatch(PlanEditorActions.setCursorLocationIds(ids)),
  clearCursorLocationIds: () => dispatch(PlanEditorActions.clearCursorLocationIds()),
  showContextMenuForLocations: (featureIds, event) => dispatch(PlanEditorActions.showContextMenuForLocations(featureIds, event)),
})

const SubnetTileOverlay = wrapComponentWithProvider(reduxStore, _SubnetTileOverlay, mapStateToProps, mapDispatchToProps)
export default SubnetTileOverlay
