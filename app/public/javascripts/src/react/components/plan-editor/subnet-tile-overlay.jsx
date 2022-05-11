import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorSelectors from './plan-editor-selectors'
import TileUtils from '../common/tile-overlay/tile-overlay-utils'
import TileDataMutator from '../common/tile-overlay/tile-data-mutator'
// global: tileCache.subnets

const _SubnetTileOverlay = props => {
  const {
    mapRef,
    subnetTileData,
    rootSubnetId,
  } = props
  const TILE_SIZE = 256
  const twoPI = 2 * Math.PI

  // --- //
  console.log(tileCache)
  // this may become it's own static class
  function renderTile (ownerDocument, points, tileId) {
    var canvas = ownerDocument.createElement('canvas')
    canvas.width = TILE_SIZE
    canvas.height = TILE_SIZE
    var ctx = canvas.getContext('2d')

    ctx.fillStyle = '#99FF99'
    Object.values(points).forEach(point => {
      let px = TileUtils.worldCoordToTilePixel(point, tileId)
      //ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)
      ctx.beginPath()
      ctx.arc(px.x, px.y, 5, 0, twoPI)
      ctx.fill()
    })

    return canvas
  }

  function getTile (ownerDocument, tileData, tileCache, tileId) {
    let tile = tileCache.getTile(tileId)
    if (!tile) {
      // not in the cache so render it
      let points = TileDataMutator.getPointsForTile(tileData, tileId)
      //console.log(points)
      if (Object.keys(points).length) {
        // render tile
        tile = renderTile(ownerDocument, points, tileId)
        tileCache.addTile(tile, tileId)
      }
    }
    return tile
  }

  // --- //

  // set up google maps getTile and releaseTile functions 
  let overlayLayer = {}
  overlayLayer.tileSize = new google.maps.Size(TILE_SIZE, TILE_SIZE)
  overlayLayer.getTile = (
    coord,//: google.maps.Point,
    zoom,//: number,
    ownerDocument,//: Document
  ) => {
    let sCoords = String(coord)
    //console.log(`getTile ${sCoords} ${zoom}`)

    let tile = null
    if (subnetTileData[rootSubnetId] && tileCache.subnets[rootSubnetId]) {
      let tileId = TileUtils.coordToTileId(coord, zoom)
      //console.log(tileId)
      tile = getTile(ownerDocument, subnetTileData[rootSubnetId], tileCache.subnets[rootSubnetId], tileId)
      
    }

    const div = ownerDocument.createElement("div");

    div.innerHTML = sCoords;
    div.style.width = overlayLayer.tileSize.width + "px";
    div.style.height = overlayLayer.tileSize.height + "px";
    div.style.fontSize = "10";
    div.style.borderStyle = "solid";
    div.style.borderWidth = "1px";
    div.style.color = div.style.borderColor = "#AAAAAA";
    if (tile) {
      div.appendChild(tile)
    }
    return div;
  }

  overlayLayer.releaseTile = (tile) => {
    //console.log(tile)
  }

  overlayLayer.redrawCachedTiles = (prop) => {console.log(prop)} // called by the OLD VTS
  
  mapRef.overlayMapTypes.push(overlayLayer)

  useEffect(() => { return () => onDestroy() }, [])
  const onDestroy = () => {
    let index = mapRef.overlayMapTypes.indexOf(overlayLayer)
    console.log(index)
    mapRef.overlayMapTypes.removeAt(index)
  }

  useEffect(() => {
    // if the data changes the cache has been updated so refresh the map
    console.log(' --- tile refresh --- ')
    let index = mapRef.overlayMapTypes.indexOf(overlayLayer)
    mapRef.overlayMapTypes.removeAt(index)
    mapRef.overlayMapTypes.push(overlayLayer)
  }, [
    subnetTileData,
    rootSubnetId,
  ])

  // No UI for this component. It deals with map objects only.
  return null
}

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
