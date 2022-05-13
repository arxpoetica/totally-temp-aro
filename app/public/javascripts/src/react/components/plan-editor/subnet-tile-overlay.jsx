import React, { useState, useEffect, Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorSelectors from './plan-editor-selectors'
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import TileDataMutator from '../common/tile-overlay/tile-data-mutator'
// global: tileCache.subnets

// --- helpers --- //
const TWO_PI = 2 * Math.PI

// needs to be a class instance becasue is needs to keep a scope for the getTile callback functions
class _SubnetTileOverlay extends Component {
  constructor (props) {
    super(props)
    this.overlayLayer = null
    //console.log(props)
  }

  // --- renderer --- //

  // this may become it's own static class
  renderTileCanvas (ownerDocument, points, tileId) {
    var canvas = ownerDocument.createElement('canvas')
    canvas.width = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    canvas.height = TileUtils.TILE_SIZE + (2 * TileUtils.TILE_MARGIN)
    var ctx = canvas.getContext('2d')

    ctx.fillStyle = '#99FF99'
    Object.values(points).forEach(point => {
      let px = TileUtils.worldCoordToTilePixel(point, tileId)
      //ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)
      ctx.beginPath()
      ctx.arc(px.x+TileUtils.TILE_MARGIN, px.y+TileUtils.TILE_MARGIN, 5, 0, TWO_PI)
      ctx.fill()
    })

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
        tile = this.renderTileCanvas(ownerDocument, points, tileId)
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
  //  this.props.subnetTileData and this.props.rootSubnetId
  //  instead of the values at time of function declarition 
  overlayGetTileCallback = (coord, zoom, ownerDocument) => {
    let sCoords = String(coord)
    //console.log(`getTile ${sCoords} ${zoom}`)
    //console.log(this.props.rootSubnetId)

    const div = ownerDocument.createElement("div")
    
    div.style.width = `${TileUtils.TILE_SIZE}px`
    div.style.height = `${TileUtils.TILE_SIZE}px`
    div.style.position = 'relative'
    div.style.overflow = 'visible'

    let tile = null
    if (this.props.subnetTileData[this.props.rootSubnetId] && tileCache.subnets[this.props.rootSubnetId]) {
      let tileId = TileUtils.coordToTileId(coord, zoom)
      //console.log(tileId)
      tile = this.getTileCanvas(
        ownerDocument, 
        this.props.subnetTileData[this.props.rootSubnetId], 
        tileCache.subnets[this.props.rootSubnetId], 
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
    if (this.props.mapRef && this.props.rootSubnetId && !this.overlayLayer) {
      this.overlayLayer = this.makeOverlayLayer()
      this.props.mapRef.overlayMapTypes.push(this.overlayLayer) // this will cause a tile refresh
      return true
    }
    return false
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
    // we could check to make sure that either rootSubnetId changed 
    //  OR subnetTileData changed on the subnet we are showing
    //  BUT that would probably take longer than simply querying cached tiles 
  }

  componentWillUnmount() {
    this.removeOverlayLayer()
  }

}

// --- //

const mapStateToProps = (state) => {
  return {
    mapRef: state.map.googleMaps,
    subnetTileData: state.subnetTileData, 
    //selectedSubnetId: state.planEditor.selectedSubnetId,
    rootSubnetId: PlanEditorSelectors.getRootSubnetIdForSelected(state),
    // tile data, useEffect: on change tell overlayLayer to run getTile on all visible tiles using clearTileCache
    // tileOverlay.clearTileCache();
  }
}

const mapDispatchToProps = dispatch => ({

})

const SubnetTileOverlay = wrapComponentWithProvider(reduxStore, _SubnetTileOverlay, mapStateToProps, mapDispatchToProps)
export default SubnetTileOverlay
